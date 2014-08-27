/*global require */

var walk    = require("walk");
var hasher = require("./hasher.js");
var path = require("path");

function FileLibrary(libraryPath) {
    this._libraryPath = libraryPath;
}

FileLibrary.prototype.load = function (callback) {
    var walker  = walk.walk(this._libraryPath, { followLinks: false });

    var files = [];
    walker.on("file", function(root, stat, next) {
        var filePath = path.normalize(path.join(root, stat.name));

        if (filePath.indexOf(".git") === -1 && stat.name.charAt(0) != ".") {
            console.log(filePath);
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
