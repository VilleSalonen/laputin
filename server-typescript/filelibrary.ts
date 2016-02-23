/// <reference path="typings/tsd.d.ts" />
/// <reference path="walk.d.ts" />

import _ = require("underscore");
import walk = require("walk");
import path = require("path");
import watch = require("watch");

import {IHasher} from "./ihasher";
import {Library} from "./library";
import {File} from "./file";

export class FileLibrary {
    private _files: { [hash: string]: File[] } = {};
    private _hashesByPaths: { [path: string]: string } = {};
    
    constructor(private _libraryPath: string, private _hasher: IHasher, private _library: Library) {
    }
    
    public load(callback: (() => void)) {
        console.time("hashing");
        
        var walker = walk.walk(this._libraryPath, { followLinks: false });
        walker.on("file", (root, stat, callback) => { this.processFile(root, stat, callback); });
        walker.on("end", () => {
            console.timeEnd("hashing");
            
            if (typeof callback !== "undefined") {
                callback();
            }

            // Start monitoring after library has been hashed. Otherwise changes
            // done to database file cause changed events to be emitted and thus
            // slow down the initial processing.
            watch.createMonitor(this._libraryPath, { "ignoreDotFiles": true }, this.startMonitoring);
        });
    }
    
    private processFile(root: string, stat: walk.WalkStat, next: (() => void)): void {
        var filePath = path.normalize(path.join(root, stat.name));

        if (filePath.indexOf(".git") === -1 && stat.name.charAt(0) != "." && filePath.indexOf("Thumbs.db") === -1) {
            this.hashAndEmit(filePath, () => {
                next();
            });
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
        monitor.on("created", (path: string) => { this.hashAndEmit(path, () => {}); });
        monitor.on("changed", (path: string) => { this.hashAndEmit(path, () => {}); });
        monitor.on("removed", (path: string) => {
            var hash = this._hashesByPaths[path];
            var files = this._files[hash];
            this._files[hash] = _.filter(files, function (file) {
                return file.path !== path;
            });

            this._library.deactivateFile(new File(hash, path, path.replace(this._libraryPath, ""), []));
        });
    }
    
    private hashAndEmit(path: string, callback: any) {
        var self = this;
        this._hasher.hash(path, function (result) {
            console.log(result.path);
            
            var file = new File(result.hash, result.path, result.path.replace(self._libraryPath, ""), []);
            
            self._library.addFile(file);

            if (typeof self._files[result.hash] === 'undefined') {
                self._files[file.hash] = [];
            }
            
            self._files[result.hash].push(file);
            self._hashesByPaths[result.path] = result.hash;

            if (typeof callback !== "undefined")
                callback();
        });
    }

    public getDuplicates(): any {
        return _.pick(this._files, function (file: any) {
            return file.length > 1;
        });
    }
}