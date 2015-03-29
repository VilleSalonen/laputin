/*global require */

var _ = require("underscore");
var sqlite3 = require("sqlite3").verbose();
var path = require("path");

var FileLibrary = require("./file_library.js").FileLibrary;

function Library(libraryPath) {
    var self = this;
    libraryPath = path.normalize(libraryPath + "/");

    this._libraryPath = libraryPath;

    this._db = new sqlite3.Database(path.join(libraryPath, ".laputin.db"));

    this._fileLibrary = new FileLibrary(libraryPath);
    this._fileLibrary.on("found", function (file) { self.addFile(file); });
    this._fileLibrary.on("lost", function (file) { self.deactivateFile(file); });
}

Library.prototype.load = function (callback) {
    var self = this;

    self._fileLibrary.load(callback);
};

Library.prototype.createNewLinkBetweenTagAndFile = function (inputTag, hash) {
    var stmt = this._db.prepare("INSERT INTO tags_files VALUES (?, ?)");
    stmt.run(inputTag.id, hash, function (err) {
        if (err) {
            if (err.code !== "SQLITE_CONSTRAINT" && typeof callback === "function") {
                callback(err, null);
            } else {
                console.log("File and tag association already exists with tag ID " + inputTag.id + " and file hash " + inputFile.hash + ". Refusing to add a duplicate association.");
            }
        }
    });
};

Library.prototype.deleteLinkBetweenTagAndFile = function (inputTag, inputFile) {
    var stmt = this._db.prepare("DELETE FROM tags_files WHERE id = ? AND hash = ?");
    stmt.run(inputTag, inputFile, function (err) {
        if (err) throw err;
    });
};

Library.prototype.getTags = function (callback) {
    var tags = [];
    this._db.each("SELECT id, name, (SELECT COUNT(*) FROM tags_files JOIN files ON tags_files.hash = files.hash WHERE tags_files.id = tags.id AND files.active = 1) AS count FROM tags WHERE count > 0", function (err, row) {
        tags.push({ "id": row.id, "name": row.name, "associationCount": row.count });
    }, function () {
        if (typeof callback !== "undefined")
            callback(tags);
    });
};

Library.prototype.addFile = function (file) {
    var stmt = this._db.prepare("INSERT OR REPLACE INTO files (hash, path, active) VALUES (?, ?, 1)");
    stmt.run(file.hash, file.path, function (err) {
        if (err) throw err;
    });
};

Library.prototype.deactivateFile = function (file) {
    var stmt = this._db.prepare("UPDATE files SET active = 0 WHERE path = ?");
    stmt.run(file.path, function (err) {
        if (err) throw err;
    });
};

Library.prototype.getFiles = function (callback) {
    var self = this;
    var files = {};
    this._db.each("SELECT * FROM files WHERE active = 1", function (err, row) {
        files[row.hash] = { "hash": row.hash, "path": row.path, "tags": [], "name": row.path.replace(self._libraryPath, "") };
    }, function () {
        self._db.each("SELECT tags.id, tags.name, tags_files.hash FROM tags_files JOIN tags ON tags.id = tags_files.id", function (err, row) {
            // Tag associations exist for inactive files but inactive files are
            // not in files list.
            if (typeof files[row.hash] !== "undefined") {
                files[row.hash].tags.push({ id: row.id, name: row.name });
            }
        }, function () {
            if (typeof callback !== "undefined")
                callback(files);
        });
    });
};

Library.prototype.createNewTag = function (tagName, callback) {
    var stmt = this._db.prepare("INSERT INTO tags VALUES (null, ?)");
    stmt.run(tagName, function (err) {
        if (err) {
            if (err.code === "SQLITE_CONSTRAINT") {
                console.log("Tag already exists with name " + tagName + ". Refusing to add another tag with this name.");
				return;
			}
			
            callback(err, null);
        }

        var tag = { id: stmt.lastID, name: tagName };
        if (typeof callback !== "undefined")
            callback(null, tag);
    });
};

Library.prototype.updateTag = function (tagId, updatedTag, callback) {
    var stmt = this._db.prepare("UPDATE tags SET name = ? WHERE id = ?");
    stmt.run(updatedTag.name, tagId, function (err) {
        if (err) {
            if (err.code === "SQLITE_CONSTRAINT")
                console.log("Tag already exists with name " + tagName + ". Refusing to add another tag with this name.");
            callback(err, null);
        }

        if (typeof callback !== "undefined")
            callback(null, updatedTag);
    });

};

exports.Library = Library;