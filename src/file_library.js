/*global require */

var walk    = require("walk");
var hasher = require("./hasher.js");
var path = require("path");
var watch = require("watch");

function FileLibrary(libraryPath) {
    var self = this;

    this._libraryPath = libraryPath;

    this.newFileCallback = undefined;
    this.deletedFileCallback = undefined;

    watch.watchTree(this._libraryPath, function (f, curr, prev) {
        if (typeof f == "object" && prev === null && curr === null) {
            // Finished walking the tree
        } else if (prev === null) {
            if (typeof self.newFileCallback === "function")
                hasher.hash(f, function (result) {
                    self.newFileCallback({ hash: result.hash, path: result.path });
                });
        } else if (curr.nlink === 0) {
            if (typeof self.deletedFileCallback === "function")
                self.deletedFileCallback({ path: f });
        }
    });
}

FileLibrary.prototype.load = function (callback) {
    var walker  = walk.walk(this._libraryPath, { followLinks: false });

    var files = [];
    walker.on("file", function(root, stat, next) {
        var filePath = path.normalize(path.join(root, stat.name));

        if (filePath.indexOf(".git") === -1 && stat.name.charAt(0) != ".") {
            hasher.hash(filePath, function (result) {
                files.push({ hash: result.hash, path: result.path });
                next();
            });
        } else {
            next();
        }
    });

    walker.on("end", function () {
        if (typeof callback !== "undefined") {
            callback(files);
        }
    });
};

exports.FileLibrary = FileLibrary;
