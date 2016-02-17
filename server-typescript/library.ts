import sqlite3 = require("sqlite3");
import path = require("path");
import _ = require("underscore");

import {Query} from "./query.model";
import {File} from "./file";
import {Tag} from "./tag";

export class Library {
    private _db: any;
    
    constructor(private _libraryPath: string) {
        this._db = new sqlite3.Database(path.join(this._libraryPath, ".laputin.db"));
    }
    
    public getFiles(query: Query, callback: (files: File[]) => void): void {
        var files: { [hash: string]: File } = {};

        var params: any[] = [];

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

        var each = function (err: any, row: any) {
            files[row.hash] = new File(row.hash, row.path, row.path.replace(this._libraryPath, ""), []);
        };
        
        var self = this;
        var complete = function () {
            self._db.each("SELECT tags.id, tags.name, tags_files.hash FROM tags_files JOIN tags ON tags.id = tags_files.id ORDER BY tags.name", function (err, row) {
                // Tag associations exist for inactive files but inactive files are
                // not in files list.
                if (typeof files[row.hash] !== "undefined") {
                    files[row.hash].tags.push(new Tag(row.id, row.name));
                }
            }, function () {
                if (typeof callback !== "undefined")
                    callback(_.values(files));
            });
        };

        params.push(each);
        params.push(complete);

        sqlite3.Statement.prototype.each.apply(stmt, params);
    }
    
    private _generateTagFilterQuery (ids: string, params: string[], opr1: string, opr2: string): string {
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
    
    public createNewTag(tagName: string, callback): void {
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
    }
    
    public getTags(query, callback) {
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
    }

    public createNewLinkBetweenTagAndFile (inputTag: Tag, hash): void {
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
}