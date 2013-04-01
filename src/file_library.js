var walk    = require('walk');
var hasher = require('./hasher.js');

function FileLibrary(libraryPath) {
    this._libraryPath = libraryPath;
};

FileLibrary.prototype.load = function (callback) {
    var walker  = walk.walk(this._libraryPath, { followLinks: false });

    var files = [];
    walker.on('file', function(root, stat, next) {
        var path = root + '/' + stat.name;

        if (path.indexOf(".git") === -1 && stat.name.charAt(0) != '.') {
            hasher.hash(path, function (result) {
                files.push({ hash: result.hash, path: result.path });
            });
        }

        next();
    });

    walker.on('end', function () {
        if (typeof callback !== 'undefined') {
            callback(files);
        }
    });
}

exports.FileLibrary = FileLibrary;
