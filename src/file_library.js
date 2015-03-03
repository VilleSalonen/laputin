/*global require */

var _ = require("underscore");
var walk    = require("walk");
var hasher = require("./hasher.js");
var path = require("path");

function FileLibrary(libraryPath) {
    this._libraryPath = libraryPath;
}

FileLibrary.prototype.load = function (callback) {
    var walker  = walk.walk(this._libraryPath, { followLinks: false });

    var files = [];
    var duplicates = {};
    walker.on("file", function(root, stat, next) {
        var filePath = path.normalize(path.join(root, stat.name));

        if (filePath.indexOf(".git") === -1 && stat.name.charAt(0) != "." && filePath.indexOf("Thumbs.db") === -1) {
            hasher.hash(filePath, function (result) {
                console.log(filePath);

                if (typeof duplicates[result.hash] === 'undefined') {
                    duplicates[result.hash] = [];
                }

                duplicates[result.hash].push({ hash: result.hash, path: result.path });
                files.push({ hash: result.hash, path: result.path });

                next();
            });
        } else {
            next();
        }
    });

    walker.on("end", function () {
        if (_.any(duplicates, function (duplicate) { return duplicate.length > 1; })) {
            console.log("");
            console.log("Found following duplicates: ");

            _.each(duplicates, function (duplicate) {
                if (duplicate.length > 1) {
                    console.log(duplicate[0].hash + ":");
                    _.each(duplicate, function (file) {
                        console.log("  " + file.path);
                    })
                    console.log("");
                }
            });
        }

        if (typeof callback !== "undefined") {
            callback(files);
        }
    });
};

exports.FileLibrary = FileLibrary;
