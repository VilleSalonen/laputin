/// <reference path="typings/main.d.ts" />
/// <reference path="walk.d.ts" />

import _ = require("underscore");
import walk = require("walk");
import path = require("path");
import watch = require("watch");
import events = require("events");

import {IHasher} from "./ihasher";
import {Library} from "./library";
import {File} from "./file";

export class FileLibrary extends events.EventEmitter {
    private _files: { [hash: string]: File[] } = {};
    private _hashesByPaths: { [path: string]: string } = {};
    
    constructor(private _libraryPath: string, private _hasher: IHasher) {
        super();
    }
    
    public load(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            var walker = walk.walk(this._libraryPath, { followLinks: false });
            walker.on("file", (root, stat, callback) => { this.processFile(root, stat, callback); });
            walker.on("end", () => {
                this.startMonitoring();
                resolve();
            });
        });
    }
    
    public close(): void {
        watch.unwatchTree(this._libraryPath);
    }
    
    private startMonitoring(): void {
        // Start monitoring after library has been hashed. Otherwise changes
        // done to database file cause changed events to be emitted and thus
        // slow down the initial processing.
        watch.createMonitor(this._libraryPath, { "ignoreDotFiles": true }, (monitor) => {
            // If files are big or copying is otherwise slow, both created and
            // changed events might be emitted for a new file. If this is the
            // case, hashing is not possible during created event and must be
            // done in changed event. However for small files or files that were
            // otherwise copied fast, only created event is emitted.
            //
            // Because of this, hashing and emitting must be done on both
            // events. Based on experiments, if both events are coming, hashing
            // cannot be done on created events. Hasher will swallow the error.
            // Thus each file is hashed and emitted just once even if both
            // events will be emitted.
            monitor.on("created", (path: string) => this.addFileFromPath(path));
            monitor.on("changed", (path: string) => this.addFileFromPath(path));
            monitor.on("removed", (path: string) => this.removeFileFromPath(path));
        });
    }
    
    private processFile(root: string, stat: walk.WalkStat, next: (() => void)): void {
        var filePath = path.normalize(path.join(root, stat.name));
        this.addFileFromPath(filePath)
            .then(next);
    }
    
    private addFileFromPath(path: string): Promise<void> {
        return this._hasher.hash(path)
            .then((result) => new File(result.hash, result.path, result.path.replace(this._libraryPath, ""), []))
            .then((file) => {
                if (this.fileShouldBeIgnored(file)) return;

                this.addFileToBookkeeping(file);
                this.emit("found", file);
            });
    }
    
    private addFileToBookkeeping(file: File): void {
        this.initializeListForHash(file);
        
        if (!this.identicalFileAlreadyExistsInIdenticalPath(file)) {
            this._files[file.hash].push(file);
            this._hashesByPaths[file.path] = file.hash;
        }
    }
    
    private fileShouldBeIgnored(file: File) {
        return path.basename(file.path).charAt(0) === "."
            || file.path.indexOf(".git") !== -1
            || file.path.indexOf("Thumbs.db") !== -1; 
    }
    
    private initializeListForHash(file: File): void {
        if (!this._files[file.hash]) {
            this._files[file.hash] = [];
        }
    }
    
    private identicalFileAlreadyExistsInIdenticalPath(file: File): boolean {
        let files = this._files[file.hash];
        return _.any(files, (fileForChecking: File): boolean => file.path == fileForChecking.path);
    }

    private removeFileFromPath(path: string): void {
        var hash = this._hashesByPaths[path];
        var files = this._files[hash];
        this._files[hash] = _.filter(files, (file: File) => {
            return file.path !== path;
        });

        this.emit("lost", new File(hash, path, path.replace(this._libraryPath, ""), []));
    }

    public getDuplicates(): any {
        return _.pick(this._files, function (file: any) {
            return file.length > 1;
        });
    }
}
