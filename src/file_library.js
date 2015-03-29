/*global require */

var _ = require("underscore");
var walk = require("walk");
var hasher = require("./hasher.js");
var path = require("path");
var watch = require("watch");
var events = require("events");

function FileLibrary(libraryPath) {
    var self = this;
    this._libraryPath = libraryPath;

    events.EventEmitter.call(this);

    watch.createMonitor(libraryPath, { "ignoreDotFiles": true }, function (monitor) {
        monitor.on("created", function (f, curr, prev) {
            hasher.hash(f, function (result) {
                console.log(result.path);
                self.emit("found", {hash: result.hash, path: result.path});
            });
        });
        monitor.on("changed", function (f, curr, prev) {
            // At least on Windows with big files created event is emitted
            // before copying has finished. Hashing is impossible during
            // copying so it must be delayed until changed event will be emitted
            // on completion of copying.
            hasher.hash(f, function (result) {
                console.log(result.path);
                self.emit("found", {hash: result.hash, path: result.path});
            });
        });
        monitor.on("removed", function (f, stat) {
            self.emit("lost", {path: f});
        });
    });
}

FileLibrary.prototype.__proto__ = events.EventEmitter.prototype;

FileLibrary.prototype.load = function (callback) {
    var self = this;

    var walker  = walk.walk(this._libraryPath, { followLinks: false });
    walker.on("file", function(root, stat, next) {
        var filePath = path.normalize(path.join(root, stat.name));

        if (filePath.indexOf(".git") === -1 && stat.name.charAt(0) != "." && filePath.indexOf("Thumbs.db") === -1) {
            hasher.hash(filePath, function (result) {
                console.log(filePath);
                self.emit("found", { hash: result.hash, path: result.path });
                next();
            });
        } else {
            next();
        }
    });

    walker.on("end", function () {
        if (typeof callback !== "undefined") {
            callback();
        }
    });
};

exports.FileLibrary = FileLibrary;
