/*global require */

var _ = require("underscore");
var walk = require("walk");
var path = require("path");
var watch = require("watch");
var events = require("events");

function FileLibrary(libraryPath, hasher) {
    this._libraryPath = libraryPath;
    this._hasher = hasher;

    this._files = {};
    this._hashesByPaths = {};

    events.EventEmitter.call(this);
}

FileLibrary.prototype.__proto__ = events.EventEmitter.prototype;

FileLibrary.prototype.load = function (callback) {
    var self = this;

    console.time("hashing");
    var walker  = walk.walk(this._libraryPath, { followLinks: false });
    walker.on("file", function(root, stat, next) {
        var filePath = path.normalize(path.join(root, stat.name));

        if (filePath.indexOf(".git") === -1 && stat.name.charAt(0) != "." && filePath.indexOf("Thumbs.db") === -1) {
            self.hashAndEmit(filePath, function () {
                next();
            });
        } else {
            next();
        }
    });

    walker.on("end", function () {
        console.timeEnd("hashing");
        // Start monitoring after library has been hashed. Otherwise changes
        // done to database file cause changed events to be emitted and thus
        // slow down the initial processing.
        watch.createMonitor(self._libraryPath, { "ignoreDotFiles": true }, function (monitor) {
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
            monitor.on("created", function (f) { self.hashAndEmit(f); });
            monitor.on("changed", function (f) { self.hashAndEmit(f); });
            monitor.on("removed", function (f) {
                var hash = self._hashesByPaths[f];
                var files = self._files[hash];
                self._files[hash] = _.filter(files, function (file) {
                    return file.path !== f;
                });

                self.emit("lost", {path: f});
            });
        });

        if (typeof callback !== "undefined") {
            callback();
        }
    });
};

FileLibrary.prototype.hashAndEmit = function (path, callback) {
    var self = this;
    this._hasher.hash(path, function (result) {
        console.log(result.path);
        self.emit("found", {hash: result.hash, path: result.path});

        if (typeof self._files[result.hash] === 'undefined') {
            self._files[result.hash] = [];
        }
        self._files[result.hash].push({ hash: result.hash, path: result.path, name: result.path.replace(self._libraryPath, "") });
        self._hashesByPaths[result.path] = result.hash;

        if (typeof callback !== "undefined")
            callback();
    });
};

FileLibrary.prototype.getDuplicates = function () {
    return _.pick(this._files, function (file) {
        return file.length > 1;
    });
};

exports.FileLibrary = FileLibrary;
