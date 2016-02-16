import sqlite3 = require("sqlite3");
import path = require("path");
import _ = require("underscore");

import {Query} from "./query.model";

export class Library {
    private _db: any;
    
    constructor(private _libraryPath: string) {
        this._db = new sqlite3.Database(path.join(this._libraryPath, ".laputin.db"));
    }
    
    public getFiles(query: Query, callback): any {
        var files = {};

        var params: string[] = [];

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
            files[row.hash] = { "hash": row.hash, "path": row.path, "tags": [], "name": row.path.replace(this._libraryPath, "") };
        };
        var self = this;
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
}