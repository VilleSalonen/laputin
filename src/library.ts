import bluebird = require('bluebird');

import sqlite3 = require('sqlite3');
bluebird.promisifyAll(sqlite3);

import path = require('path');
import _ = require('lodash');

import { Query } from './query.model';
import { File } from './file';
import { Tag, TagTimecode } from './tag';
import { TagQuery } from './tagquery.model';

export class Library {
    private _db: any;

    constructor(private _libraryPath: string) {
        this._db = new sqlite3.Database(path.join(this._libraryPath, '.laputin.db'));
    }

    public async createTables(): Promise<void> {
        await this._db.runAsync('CREATE TABLE tags (id INTEGER PRIMARY KEY autoincrement, name TEXT UNIQUE);');
        await this._db.runAsync('CREATE TABLE tags_files (id INTEGER, hash TEXT, PRIMARY KEY (id, hash));');
        await this._db.runAsync('CREATE TABLE files (hash TEXT UNIQUE, path TEXT UNIQUE, active INTEGER);');
        await this._db.runAsync(`CREATE TABLE tags_files_timecodes (
            id INTEGER PRIMARY KEY autoincrement,
            tag_id INTEGER,
            hash TEXT,
            start REAL,
            end REAL
        );`);
    }

    public addFile(file: File): Promise<void> {
        const stmt = this._db.prepare('INSERT OR REPLACE INTO files (hash, path, active) VALUES (?, ?, 1)');
        return stmt.runAsync(file.hash, file.path);
    }

    public deactivateFile(file: File): Promise<void> {
        const stmt = this._db.prepare('UPDATE files SET active = 0 WHERE path = ?');
        return stmt.runAsync(file.path);
    }

    public deactivateAll(): Promise<void> {
        const stmt = this._db.prepare('UPDATE files SET active = 0');
        return stmt.runAsync();
    }

    public async getFiles(query: Query): Promise<File[]> {
        let done: Function;
        const promise = new Promise<File[]>((resolve, reject) => done = resolve);

        const files: { [hash: string]: File } = {};

        const params: any[] = [];

        let sql1 = 'SELECT files.hash, files.path FROM files WHERE active = 1';
        if (query.filename) {
            sql1 += ' AND path LIKE ? COLLATE NOCASE';
            params.push('%' + query.filename + '%');
        }
        if (query.status) {
            if (query.status === 'tagged' || query.status === 'untagged') {
                const operator = (query.status === 'tagged') ? '>' : '=';
                sql1 += ' AND (SELECT COUNT(*) FROM tags_files WHERE tags_files.hash = files.hash) ' + operator + ' 0';
            }
        }

        if (query.hash) {
            sql1 += ' AND hash = ? ';
            params.push(query.hash);
        }

        if (query.and || query.or || query.not) {
            sql1 += ' AND (SELECT COUNT(*) FROM tags_files WHERE tags_files.hash = files.hash) > 0';
        }
        sql1 += this._generateTagFilterQuery(query.and, params, 'IN', 'AND');
        sql1 += this._generateTagFilterQuery(query.or, params, 'IN', 'OR');
        sql1 += this._generateTagFilterQuery(query.not, params, 'NOT IN', 'AND');

        sql1 += ' ORDER BY path ';

        const each1 = (err: any, row: any) => {
            files[row.hash] = new File(row.hash, row.path, []);
        };

        const stmt = this._db.prepare(sql1);
        await stmt.eachAsync(params, each1);

        const sql2 = 'SELECT tags.id, tags.name, tags_files.hash FROM tags_files JOIN tags ON tags.id = tags_files.id ORDER BY tags.name';
        const each2 = function (err: Error, row: any) {
            // Tag associations exist for inactive files but inactive files are
            // not in files list.
            if (typeof files[row.hash] !== 'undefined') {
                files[row.hash].tags.push(new Tag(row.id, row.name, 0));
            }
        };
        await this._db.eachAsync(sql2, each2);

        done(_.values(files));

        return promise;
    }

    private _generateTagFilterQuery(ids: string, params: string[], opr1: string, opr2: string): string {
        if (ids) {
            const splitIds = ids.split(',');
            splitIds.forEach((id) => {
                params.push(id);
            });
            const wheres = _.map(splitIds, () => {
                return ' files.hash ' + opr1 + ' (SELECT hash FROM tags_files WHERE id=?) ';
            });

            return ' AND ( ' + wheres.join(' ' + opr2 + ' ') + ' ) ';
        }

        return '';
    }

    public async createNewTag(tagName: string): Promise<Tag> {
        if (!tagName) {
            return Promise.reject<Tag>(new Error('Tag name is required'));
        }

        const stmt = this._db.prepare('INSERT INTO tags VALUES (null, ?)');
        await stmt.runAsync(tagName);
        return new Tag(stmt.lastID, tagName, 0);
    }

    public async renameTag(tagId: number, tagName: string): Promise<Tag> {
        if (!tagId) {
            return Promise.reject<Tag>(new Error('Tag ID is required'));
        }
        if (!tagName) {
            return Promise.reject<Tag>(new Error('Tag name is required'));
        }

        const stmt = this._db.prepare('UPDATE tags SET name = ? WHERE id = ?');
        await stmt.runAsync(tagName, tagId);
        return new Tag(tagId, tagName, 0);
    }

    public async getTags(query: TagQuery): Promise<Tag[]> {
        const tags: Tag[] = [];

        const params: any[] = [];
        let sql = `
            SELECT id, name, (
                SELECT COUNT(*)
                FROM tags_files
                JOIN files ON tags_files.hash = files.hash
                WHERE
                    tags_files.id = tags.id AND
                    files.active = 1
            ) AS count
            FROM tags
            WHERE
        `;

        if (query && query.unassociated) {
            sql += ' count >= 0 ';
        } else {
            sql += ' count > 0 ';
        }

        if (query && query.selectedTags) {
            const wheres: string[] = [];
            query.selectedTags.forEach((tag) => {
                params.push(tag.id);
                wheres.push(' id = ? ');
            });

            const wheresJoined = wheres.join(' OR ');
            sql += ` AND id IN (
                SELECT DISTINCT id
                FROM tags_files
                WHERE hash IN (
                    SELECT DISTINCT hash
                    FROM tags_files
                    WHERE ` + wheresJoined + `
                )
            )`;

            const selectedIds: string[] = [];
            query.selectedTags.forEach((tag) => {
                params.push(tag.id);
                selectedIds.push(' ? ');
            });

            sql += ' AND id NOT IN (' + selectedIds.join(',') + ')';
        }

        sql += ' ORDER BY name ';

        const each = (err: Error, row: any) => {
            tags.push(new Tag(row.id, row.name, row.count));
        };

        const stmt = this._db.prepare(sql);
        await stmt.eachAsync(params, each);
        return tags;
    }

    public async createNewLinkBetweenTagAndFile(inputTag: Tag, hash: string): Promise<void> {
        const stmt = this._db.prepare('INSERT INTO tags_files VALUES (?, ?)');

        try {
            await stmt.runAsync(inputTag.id, hash);
        } catch (err) {
            if (err.code !== 'SQLITE_CONSTRAINT') {
                console.log(err);
                return;
            } else {
                const error = 'File and tag association already exists with tag ID ' + inputTag.id +
                    ' and file hash ' + hash + '. Refusing to add a duplicate association.';
                console.log(error);
            }
        }
    }

    public async addTimecodeToTagAssociation(inputTag: Tag, hash: string, start: number, end: number): Promise<void> {
        const stmt = this._db.prepare(`INSERT INTO tags_files_timecodes
            VALUES (
                null,
                ?,
                ?,
                ?,
                ?
            )`);

        await stmt.runAsync(inputTag.id, hash, start, end);
    }

    public async getTagTimecodesForFile(hash: string): Promise<TagTimecode[]> {
        const tags: TagTimecode[] = [];

        const params: any[] = [];
        params.push(hash);

        const sql = `
            SELECT
                tags_files_timecodes.id AS id,
                tags.id AS tag_id,
                tags.name AS tag_name,
                tags_files_timecodes.start,
                tags_files_timecodes.end
            FROM tags_files_timecodes
            JOIN tags ON tags.id = tags_files_timecodes.tag_id
            WHERE hash = ?
            ORDER BY tags_files_timecodes.start
        `;

        const each = (err: Error, row: any) => {
            tags.push(new TagTimecode(row.id, row.tag_id, row.tag_name, row.start, row.end));
        };

        const stmt = this._db.prepare(sql);
        await stmt.eachAsync(params, each);

        return tags;
    }

    public deleteLinkBetweenTagAndFile(inputTag: number, inputFile: string): Promise<void> {
        const stmt = this._db.prepare('DELETE FROM tags_files WHERE id = ? AND hash = ?');
        return stmt.runAsync(inputTag, inputFile);
    }
}
