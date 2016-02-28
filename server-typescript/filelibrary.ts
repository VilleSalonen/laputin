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
        var done: Function;
        var promise = new Promise<void>((resolve, reject) => { done = resolve; });
        
        var walker = walk.walk(this._libraryPath, { followLinks: false });
        walker.on("file", (root, stat, callback) => { this.processFile(root, stat, callback); });
        walker.on("end", () => {
            // Start monitoring after library has been hashed. Otherwise changes
            // done to database file cause changed events to be emitted and thus
            // slow down the initial processing.
            watch.createMonitor(this._libraryPath, { "ignoreDotFiles": true }, (monitor) => this.startMonitoring(monitor));
            
            done();
        });
        
        return promise;
    }
    
    public close(): void {
        watch.unwatchTree(this._libraryPath);
    }
    
    private processFile(root: string, stat: walk.WalkStat, next: (() => void)): void {
        var filePath = path.normalize(path.join(root, stat.name));

        if (filePath.indexOf(".git") === -1 && stat.name.charAt(0) != "." && filePath.indexOf("Thumbs.db") === -1) {
            this.hashAndEmit(filePath)
                .then(() => { next(); });
        } else {
            next();
        }
    }
    
    private startMonitoring(monitor: watch.Monitor): void {
        // If files are big or copying is otherwise slow, both created and
        // changed events might be emitted for a new file. If this is the
        // case, hashing is not possible during created event and must be
        // done in changed event. However for small files or files that were
        // otherwise copied fast, only created event is emitted.
        //
        // Because of this, hashing and emitting must be done on both
        // events. Based on experiments, if both events are coming, hashing
        // cannot be done on created events. Hasher will swallow the error.
        // Thus each files is hashed and emitted just once even if both
        // events will be emitted.
        monitor.on("created", (path: string) => { this.hashAndEmit(path); });
        monitor.on("changed", (path: string) => { this.hashAndEmit(path); });
        monitor.on("removed", (path: string) => {
            var hash = this._hashesByPaths[path];
            var files = this._files[hash];
            this._files[hash] = _.filter(files, (file: File) => {
                return file.path !== path;
            });

            this.emit("lost", new File(hash, path, path.replace(this._libraryPath, ""), []));
        });
    }
    
    private hashAndEmit(path: string): Promise<void> {
        return this._hasher.hash(path)
            .then((result) => { return new File(result.hash, result.path, result.path.replace(this._libraryPath, ""), []) })
            .then((file) => {
                if (typeof this._files[file.hash] === 'undefined') {
                    this._files[file.hash] = [];
                }
                
                if (!this.identicalFileAlreadyExistsInIdenticalPath(file)) {
                    this._files[file.hash].push(file);
                    this._hashesByPaths[file.path] = file.hash;
                }
                
                this.emit("found", file);
            });
    }
    
    private identicalFileAlreadyExistsInIdenticalPath(file: File): boolean {
        let files = this._files[file.hash];
        return _.any(files, (fileForChecking: File): boolean => file.path == fileForChecking.path);
    }

    public getDuplicates(): any {
        return _.pick(this._files, function (file: any) {
            return file.length > 1;
        });
    }
}
