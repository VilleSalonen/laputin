var _ = require("underscore");
var sqlite3 = require("sqlite3").verbose();
var async = require("async");
var path = require("path");

var FileLibrary = require("./file_library.js").FileLibrary;


function Library(libraryPath) {
    libraryPath = path.normalize(libraryPath + "/");

    this._tags = {};
    this._files = {};
    this._libraryPath = libraryPath;
    this._fileLibrary = new FileLibrary(libraryPath);
    this._db = new sqlite3.Database(path.join(libraryPath, ".laputin.db"));
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
            self._db.run("DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT id FROM tags_files)", function () {
                self._db.each("SELECT * FROM tags", function (err, tag) {
                    self.addTag(tag);
                }, function () {
                    callback(null);
                });
            });
        }
    ],

    function () {
        self._db.each("SELECT * FROM tags_files", function (err, row) {
            var tag = { id: row.id };
            var file = { hash: row.hash };

            self._linkTagToFile(tag, file);
        }, function () {
            if (typeof callback !== "undefined")
                callback();
        });
    });
};

Library.prototype.createNewLinkBetweenTagAndFile = function (inputTag, inputFile) {
    var stmt = this._db.prepare("INSERT INTO tags_files VALUES (?, ?)");
    stmt.run(inputTag.id, inputFile.hash);
    stmt.finalize();

    this._linkTagToFile(inputTag, inputFile);
};

Library.prototype.deleteLinkBetweenTagAndFile = function (inputTag, inputFile) {
    var self = this;
    var stmt = this._db.prepare("DELETE FROM tags_files WHERE id = ? AND hash = ?");
    stmt.run(inputTag.id, inputFile.hash, function (err) {
        if (err) throw err;

        stmt.finalize();
        self._unlinkTagFromFile(inputTag, inputFile);
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
    file.name = file.path.replace(this._libraryPath, "");
    this._files[file.hash] = file;
};

Library.prototype.getFiles = function () {
    return this._files;
};

Library.prototype.createNewTag = function (tagName, callback) {
    var self = this;
    var stmt = this._db.prepare("INSERT INTO tags VALUES (null, ?)");
    stmt.run(tagName, function (err) {
        if (err) {
            if (err.code === "SQLITE_CONSTRAINT")
                console.log("Tag already exists with name " + tagName + ". Refusing to add another tag with this name.");
            callback(err, null);
        }

        var tag = { id: stmt.lastID, name: tagName };
        self.addTag(tag);

        stmt.finalize();

        if (typeof callback !== "undefined")
            callback(null, tag);
    });
};

Library.prototype._linkTagToFile = function (inputTag, inputFile) {
    var tag = this._tags[inputTag.id];
    var file = this._files[inputFile.hash];

    if (typeof tag === "undefined") {
        console.log("Could not find tag with ID " + inputTag.id + " and name " + inputTag.name + ". Refusing to link it to file.");
        return;
    }
    if (typeof file === "undefined") {
        console.log("Could not find file with hash " + inputFile.hash + ". Deleting tag associations of this missing file.");
        this._db.run("DELETE FROM tags_files WHERE hash = ?", inputFile.hash);
        return;
    }

    tag.files.push({ hash: file.hash, path: file.path });
    file.tags.push({ id: tag.id, name: tag.name });
};

Library.prototype._unlinkTagFromFile = function (inputTag, inputFile) {
    var tag = this._tags[inputTag.id];
    var file = this._files[inputFile.hash];

    if (typeof tag === "undefined") {
        console.log("Could not find tag with ID " + inputTag.id + " and name " + inputTag.name + ". Refusing to link it to file.");
        return;
    }
    if (typeof file === "undefined") {
        console.log("Could not find file with hash " + inputFile.hash + ".");
        return;
    }

    tag.files = _.filter(tag.files, function (currentFile) {
        return currentFile.hash != file.hash;
    });
    file.tags = _.filter(file.tags, function (currentTag) {
        return currentTag.id != tag.id;
    });
};

Library.prototype.updateTag = function (tagId, updatedTag, callback) {
    var tag = this._tags[tagId];

    if (typeof tag === "undefined") {
        console.log("Could not find tag with ID " + tagId + ". Refusing to update it.");
        return;
    }

    this._tags[tagId].name = updatedTag.name;

    var stmt = this._db.prepare("UPDATE tags SET name = ? WHERE id = ?");
    stmt.run(updatedTag.name, tagId, function (err) {
        if (err) {
            if (err.code === "SQLITE_CONSTRAINT")
                console.log("Tag already exists with name " + tagName + ". Refusing to add another tag with this name.");
            callback(err, null);
        }

        stmt.finalize();

        if (typeof callback !== "undefined")
            callback(null, updatedTag);
    });

};

exports.Library = Library;