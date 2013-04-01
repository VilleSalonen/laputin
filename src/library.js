var _ = require('underscore');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');
var path = require("path");

var FileLibrary = require('./file_library.js').FileLibrary;


function Library(libraryPath) {
    this._tags = {};
    this._files = {};
    this._fileLibrary = new FileLibrary(libraryPath);
    this._db = new sqlite3.Database(path.join(libraryPath, '.laputin.db'));
}

Library.prototype.load = function (callback) {
    var self = this;

    async.parallel([
        function (callback) {
            self._fileLibrary.load(function (files) {
                _.each(files, function (file) {
                    self.addFile(file);
                });
                callback(null);
            });
        },
        function (callback) {
            self._db.each("SELECT * FROM tags", function (err, tag) {
                self.addTag(tag);
            }, function () {
                callback(null);
            });
        }
    ],

    function () {
        self._db.each("SELECT * FROM tags_files", function (err, row) {
            var tag = { id: row.id };
            var file = { hash: row.hash };

            self.linkTagToFile(tag, file);
        }, function () {
            if (typeof callback !== 'undefined')
                callback();
        });
    });
};

Library.prototype.addTag = function (tag) {
    tag.files = tag.files || [];
    this._tags[tag.id] = tag;
};

Library.prototype.getTags = function () {
    return this._tags;
};

Library.prototype.addFile = function (file) {
    file.tags = file.tags || [];
    this._files[file.hash] = file;
};

Library.prototype.getFiles = function () {
    return this._files;
};

Library.prototype.linkTagToFile = function (inputTag, inputFile) {
    var tag = this._tags[inputTag.id];
    var file = this._files[inputFile.hash];

    if (typeof tag === 'undefined') {
        console.log("Could not find tag with ID " + inputTag.id + " and name " + inputTag.name + ". Refusing to link it to file.");
        return;
    }
    if (typeof file === 'undefined') {
        console.log("Could not find file with hash " + inputFile.hash + ".");
        return;
    }

    tag.files.push({ hash: file.hash, path: file.path });
    file.tags.push({ id: tag.id, name: tag.name });
};

exports.Library = Library;