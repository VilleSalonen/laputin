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
                console.log("File and tag association already exists with tag ID " + inputTag.id + " and file hash " + hash + ". Refusing to add a duplicate association.");
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

Library.prototype.getTags = function (query, callback) {
    var tags = [];

    var params = [];
    var sql = "SELECT id, name, (SELECT COUNT(*) FROM tags_files JOIN files ON tags_files.hash = files.hash WHERE tags_files.id = tags.id AND files.active = 1) AS count FROM tags WHERE ";

    if (query && query.unassociated) {
        sql += " count >= 0 ";
    } else {
        sql += " count > 0 ";
    }

    if (query && query.selectedTags) {
        var wheres = [];
        _.each(query.selectedTags, function (tag) {
            params.push(tag.id);
            wheres.push(" id = ? ");
        });

        if (wheres.length > 0) {

        }

        var wheresJoined = wheres.join(" OR ");
        sql += " AND id IN (SELECT DISTINCT id FROM tags_files WHERE hash IN (SELECT DISTINCT hash FROM tags_files WHERE " + wheresJoined + "))";


        var selectedIds = [];
        _.each(query.selectedTags, function (tag) {
            params.push(tag.id);
            selectedIds.push(" ? ");
        });

        sql += " AND id NOT IN (" + selectedIds.join(",") + ")";
    }

    sql += " ORDER BY name ";

    var stmt = this._db.prepare(sql);

    var each = function (err, row) {
        tags.push({ "id": row.id, "name": row.name, "associationCount": row.count });
    };
    var complete = function () {
        if (typeof callback !== "undefined")
            callback(tags);
    };

    params.push(each);
    params.push(complete);

    sqlite3.Statement.prototype.each.apply(stmt, params);
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

Library.prototype.getFiles = function (query, callback) {
    var self = this;
    var files = {};

    var params = [];

    var sql = "SELECT files.hash, files.path FROM files WHERE active = 1";
    if (query.filename) {
        sql += " AND path LIKE ? COLLATE NOCASE";
        params.push("%" + query.filename + "%");
    }
    if (query.status) {
        if (query.status === "tagged" || query.status === "untagged") {
            var operator = (query.status === "tagged") ? ">" : "=";
            sql += " AND (SELECT COUNT(*) FROM tags_files WHERE tags_files.hash = files.hash) " + operator + " 0";
        }
    }

    if (query.hash) {
        sql += " AND hash = ? ";
        params.push(query.hash);
    }

    if (query.and || query.or || query.not) {
        sql += " AND (SELECT COUNT(*) FROM tags_files WHERE tags_files.hash = files.hash) > 0";
    }
    sql += this._generateTagFilterQuery(query.and, params, "IN", "AND");
    sql += this._generateTagFilterQuery(query.or, params, "IN", "OR");
    sql += this._generateTagFilterQuery(query.not, params, "NOT IN", "AND");

    sql += " ORDER BY path ";

    var stmt = this._db.prepare(sql);

    var each = function (err, row) {
        files[row.hash] = { "hash": row.hash, "path": row.path, "tags": [], "name": row.path.replace(self._libraryPath, "") };
    };
    var complete = function () {
        self._db.each("SELECT tags.id, tags.name, tags_files.hash FROM tags_files JOIN tags ON tags.id = tags_files.id ORDER BY tags.name", function (err, row) {
            // Tag associations exist for inactive files but inactive files are
            // not in files list.
            if (typeof files[row.hash] !== "undefined") {
                files[row.hash].tags.push({ id: row.id, name: row.name });
            }
        }, function () {
            if (typeof callback !== "undefined")
                callback(files);
        });
    };

    params.push(each);
    params.push(complete);

    sqlite3.Statement.prototype.each.apply(stmt, params);
};

Library.prototype._generateTagFilterQuery = function (ids, params, opr1, opr2) {
    if (ids) {
        var splitIds = ids.split(",");
        _.each(splitIds, function (id) {
            params.push(id);
        });
        var wheres = _.map(splitIds, function (id) {
            return " files.hash " + opr1 + " (SELECT hash FROM tags_files WHERE id=?) "
        });

        return " AND ( " + wheres.join(" " + opr2 + " ") + " ) ";
    }

    return "";
};

Library.prototype.getDuplicates = function () {
    return this._fileLibrary.getDuplicates();
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
                console.log("Tag already exists with name " + updatedTag.name + ". Refusing to add another tag with this name.");
            callback(err, null);
        }

        if (typeof callback !== "undefined")
            callback(null, updatedTag);
    });

};

exports.Library = Library;