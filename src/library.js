/*global require */

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
                self._db.each("select a.id, a.name, c.id as rel_id, (select name from tags as d where d.id = c.id) as rel_name, (select count(*) from tags_files where id = a.id) as total_count, count(c.id) as rel_count from tags as a join tags_files as b on a.id = b.id join tags_files as c on b.hash = c.hash where a.id != c.id group by a.id, c.id order by a.name, rel_count desc", function (err, tag) {
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
            _.each(self._tags, function (tag) {
                if (tag && _.size(tag.files) === 0) {
                    delete self._tags[tag.id];
                }
            });

            if (typeof callback !== "undefined")
                callback();
        });
    });
};

Library.prototype.createNewLinkBetweenTagAndFile = function (inputTag, inputFile) {
    var stmt = this._db.prepare("INSERT INTO tags_files VALUES (?, ?)");
    stmt.run(inputTag.id, inputFile.hash, function (err) {
        if (err) {
            if (err.code !== "SQLITE_CONSTRAINT" && typeof callback === "function") {
                callback(err, null);
            } else {
                console.log("File and tag association already exists with tag ID " + inputTag.id + " and file hash " + inputFile.hash + ". Refusing to add a duplicate association.");
            }
        }

        stmt.finalize();
    });

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
    if (!(tag.id in this._tags)) {
        var tagObject = {
            id: tag.id,
            name: tag.name,
            files: [],
            related: []
        };
        
        this._tags[tag.id] = tagObject;
    }
    
    if ('rel_name' in tag) {
        this._tags[tag.id].related.push({
            id: tag.rel_id,
            name: tag.rel_name,
            rel_count: tag.rel_count,
            total_count: tag.total_count
        });
    }
};

Library.prototype.getTags = function () {
    return this._tags;
};

Library.prototype.addFile = function (file) {
    file.tags = file.tags || [];
    file.name = file.path.replace(this._libraryPath, "");
    this._files[file.hash] = file;
};

Library.prototype.deleteFile = function (file) {
    var self = this;

    var tagsOfFile = file.tags;

    _.each(file.tags, function (tag) {
        self._unlinkTagFromFile(tag, file);
    });
    delete this._files[file.hash];

    _.each(tagsOfFile, function (tag) {
        // Tags in file do not contain full tag information so we have to load
        // tag from the library.
        var tagFromLibrary = self._tags[tag.id];
        if (_.size(tagFromLibrary.files) === 0) {
            delete self._tags[tagFromLibrary.id];
        }
    });
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