/// <reference path="typings/main.d.ts" />

import Promise = require("bluebird");

import sqlite3 = require("sqlite3");
Promise.promisifyAll(sqlite3);

import path = require("path");
import _ = require("underscore");

import {Query} from "./query.model";
import {File} from "./file";
import {Tag} from "./tag";
import {TagQuery} from "./tagquery.model";
import {FileLibrary} from "./filelibrary";

export class Library {
    private _db: any;
    
    constructor(private _libraryPath: string) {
        this._db = new sqlite3.Database(path.join(this._libraryPath, ".laputin.db"));
    }
    
    public async createTables(): Promise<void> {
        await this._db.runAsync("CREATE TABLE tags (id INTEGER PRIMARY KEY autoincrement, name TEXT UNIQUE);");
        await this._db.runAsync("CREATE TABLE tags_files (id INTEGER, hash TEXT, PRIMARY KEY (id, hash));");
        await this._db.runAsync("CREATE TABLE files (hash TEXT UNIQUE, path TEXT UNIQUE, active INTEGER);");
    }
    
    public addFile(file: File): Promise<void> {
        var stmt = this._db.prepare("INSERT OR REPLACE INTO files (hash, path, active) VALUES (?, ?, 1)");
        return stmt.runAsync(file.hash, file.path);
    }
    
    public deactivateFile(file: File): Promise<void> {
        var stmt = this._db.prepare("UPDATE files SET active = 0 WHERE path = ?");
        return stmt.runAsync(file.path);
    }

    public deactivateAll(): Promise<void> {
        var stmt = this._db.prepare("UPDATE files SET active = 0");
        return stmt.runAsync();
    }

    public async getFiles(query: Query): Promise<File[]> {
        var files: { [hash: string]: File } = {};

        var params: any[] = [];

        var sql1 = "SELECT files.hash, files.path FROM files WHERE active = 1";
        if (query.filename) {
            sql1 += " AND path LIKE ? COLLATE NOCASE";
            params.push("%" + query.filename + "%");
        }
        if (query.status) {
            if (query.status === "tagged" || query.status === "untagged") {
                var operator = (query.status === "tagged") ? ">" : "=";
                sql1 += " AND (SELECT COUNT(*) FROM tags_files WHERE tags_files.hash = files.hash) " + operator + " 0";
            }
        }

        if (query.hash) {
            sql1 += " AND hash = ? ";
            params.push(query.hash);
        }

        if (query.and || query.or || query.not) {
            sql1 += " AND (SELECT COUNT(*) FROM tags_files WHERE tags_files.hash = files.hash) > 0";
        }
        sql1 += this._generateTagFilterQuery(query.and, params, "IN", "AND");
        sql1 += this._generateTagFilterQuery(query.or, params, "IN", "OR");
        sql1 += this._generateTagFilterQuery(query.not, params, "NOT IN", "AND");

        sql1 += " ORDER BY path ";

        var each1 = (err: any, row: any) => {
            files[row.hash] = new File(row.hash, row.path, []);
        };
        
        var stmt = this._db.prepare(sql1);
        await stmt.eachAsync(params, each1)

        var sql2 = "SELECT tags.id, tags.name, tags_files.hash FROM tags_files JOIN tags ON tags.id = tags_files.id ORDER BY tags.name";
        var each2 = function (err: Error, row: any) {
            // Tag associations exist for inactive files but inactive files are
            // not in files list.
            if (typeof files[row.hash] !== "undefined") {
                files[row.hash].tags.push(new Tag(row.id, row.name, 0));
            }
        };
        await this._db.eachAsync(sql2, each2);

        return _.values(files);
    }
    
    private _generateTagFilterQuery (ids: string, params: string[], opr1: string, opr2: string): string {
        if (ids) {
            var splitIds = ids.split(",");
            splitIds.forEach((id) => {
                params.push(id);
            });
            var wheres = _.map(splitIds, () => {
                return " files.hash " + opr1 + " (SELECT hash FROM tags_files WHERE id=?) "
            });

            return " AND ( " + wheres.join(" " + opr2 + " ") + " ) ";
        }

        return "";
    }
    
    public async createNewTag(tagName: string): Promise<Tag> {
        if (!tagName) {
            return Promise.reject<Tag>(new Error("Tag name is required"));
        }
        
        var stmt = this._db.prepare("INSERT INTO tags VALUES (null, ?)");
        await stmt.runAsync(tagName);
        return new Tag(stmt.lastID, tagName, 0);
    }
    
    public async getTags(query: TagQuery): Promise<Tag[]> {
        var tags: Tag[] = [];

        var params: any[] = [];
        var sql = "SELECT id, name, (SELECT COUNT(*) FROM tags_files JOIN files ON tags_files.hash = files.hash WHERE tags_files.id = tags.id AND files.active = 1) AS count FROM tags WHERE ";

        if (query && query.unassociated) {
            sql += " count >= 0 ";
        } else {
            sql += " count > 0 ";
        }

        if (query && query.selectedTags) {
            var wheres: string[] = [];
            query.selectedTags.forEach((tag) => {
                params.push(tag.id);
                wheres.push(" id = ? ");
            });

            var wheresJoined = wheres.join(" OR ");
            sql += " AND id IN (SELECT DISTINCT id FROM tags_files WHERE hash IN (SELECT DISTINCT hash FROM tags_files WHERE " + wheresJoined + "))";

            var selectedIds: string[] = [];
            query.selectedTags.forEach((tag) => {
                params.push(tag.id);
                selectedIds.push(" ? ");
            });

            sql += " AND id NOT IN (" + selectedIds.join(",") + ")";
        }

        sql += " ORDER BY name ";

        var each = (err: Error, row: any) => {
            tags.push(new Tag(row.id, row.name, row.count));
        };

        var stmt = this._db.prepare(sql);
        await stmt.eachAsync(params, each)
        return _.values(tags);
    }

    public async createNewLinkBetweenTagAndFile (inputTag: Tag, hash: string): Promise<void> {
        var stmt = this._db.prepare("INSERT INTO tags_files VALUES (?, ?)");
        
        try
        {
            await stmt.runAsync(inputTag.id, hash);
        }
        catch (err) {
            if (err.code !== "SQLITE_CONSTRAINT") {
                console.log(err);
                return;
            } else {
                console.log("File and tag association already exists with tag ID " + inputTag.id + " and file hash " + hash + ". Refusing to add a duplicate association.");
            }
        }
    }
    
    public deleteLinkBetweenTagAndFile(inputTag: number, inputFile: string): Promise<void> {
        var stmt = this._db.prepare("DELETE FROM tags_files WHERE id = ? AND hash = ?");
        return stmt.runAsync(inputTag, inputFile);
    }
}