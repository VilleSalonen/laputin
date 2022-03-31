import bluebird = require('bluebird');

import sqlite3 = require('sqlite3');
bluebird.promisifyAll(sqlite3);

import path = require('path');
import _ = require('lodash');
import fs = require('fs');
import winston = require('winston');

import { Query } from './query.model';
import { File } from './file';
import { Tag, Timecode, TimecodeTag } from './tag';
import { TagQuery } from './tagquery.model';

export class Library {
    private _db: any;

    static async initialize(libraryPath: string): Promise<void> {
        if (
            !fs.existsSync(libraryPath) ||
            !fs.statSync(libraryPath).isDirectory()
        ) {
            throw new Error(
                `Directory ${libraryPath} is not a valid directory.`
            );
        }

        const dbPath = path.join(libraryPath, '.laputin.db');
        if (fs.existsSync(dbPath)) {
            throw new Error(
                `${libraryPath} has already been initialized as Laputin library. Refusing to re-initialize.`
            );
        }
        const db = new sqlite3.Database(dbPath);

        await (<any>db).runAsync(
            'CREATE TABLE tags (id INTEGER PRIMARY KEY autoincrement, name TEXT UNIQUE);'
        );
        await (<any>db).runAsync(
            'CREATE TABLE tags_files (id INTEGER, hash TEXT, PRIMARY KEY (id, hash));'
        );
        await (<any>db).runAsync(
            'CREATE TABLE files (hash TEXT UNIQUE, path TEXT UNIQUE, active INTEGER, size INTEGER, metadata BLOB, type TEXT);'
        );
        await (<any>db).runAsync(
            'CREATE INDEX tags_files_id ON tags_files (id);'
        );
        await (<any>db).runAsync(
            'CREATE INDEX tags_files_hash ON tags_files (hash);'
        );
        await (<any>db).runAsync(`CREATE TABLE files_timecodes (
            id INTEGER PRIMARY KEY autoincrement,
            hash TEXT,
            start REAL,
            end REAL
        );`);
        await (<any>db).runAsync(`CREATE TABLE files_timecodes_tags (
            id INTEGER PRIMARY KEY autoincrement,
            timecode_id INTEGER,
            tag_id INTEGER
        );`);
        await (<any>db).runAsync(
            'CREATE TABLE screenshot_times_files (hash TEXT PRIMARY KEY, time REAL);'
        );
        await (<any>db).runAsync(
            'CREATE TABLE screenshot_times_tags (id INTEGER PRIMARY KEY, hash TEXT, time REAL);'
        );
        await (<any>db).runAsync(
            'CREATE TABLE screenshot_times_timecodes (id INTEGER PRIMARY KEY, time REAL);'
        );
    }

    constructor(private _libraryPath: string) {
        if (
            !fs.existsSync(this._libraryPath) ||
            !fs.statSync(this._libraryPath).isDirectory()
        ) {
            throw new Error(
                `Directory ${this._libraryPath} is not a valid directory.`
            );
        }

        const dbPath = path.join(this._libraryPath, '.laputin.db');
        if (!fs.existsSync(dbPath)) {
            winston.error(
                `${this._libraryPath} has not been initialized as Laputin library.`
            );
            process.exit(-1);
        }

        this._db = new sqlite3.Database(dbPath);
    }

    public async addFile(file: File): Promise<void> {
        let existingFile;
        try {
            const files = await this.getFiles(
                new Query(
                    undefined,
                    undefined,
                    file.hash,
                    undefined,
                    undefined,
                    undefined,
                    true
                )
            );
            if (files.length > 0) {
                existingFile = files[0];
            }
        } catch (e) {
            // OK
        }

        const metadata = existingFile
            ? { ...existingFile.metadata, ...file.metadata }
            : file.metadata;

        const stmt = this._db.prepare(
            'INSERT OR REPLACE INTO files (hash, path, active, size, metadata, type) VALUES (?, ?, 1, ?, ?, ?)'
        );
        await stmt.runAsync(
            file.hash,
            file.path,
            file.size,
            JSON.stringify(metadata),
            file.type
        );
    }

    public deactivateFile(file: File): Promise<void> {
        const stmt = this._db.prepare(
            'UPDATE files SET active = 0 WHERE path = ?'
        );
        return stmt.runAsync(file.path);
    }

    public deactivateAll(): Promise<void> {
        const stmt = this._db.prepare('UPDATE files SET active = 0');
        return stmt.runAsync();
    }

    public async getFile(hash: string): Promise<File> {
        const query = new Query(
            undefined,
            undefined,
            hash,
            undefined,
            undefined,
            undefined,
            undefined
        );

        const matchingFiles = await this.getFiles(query);
        if (matchingFiles.length > 1) {
            throw new Error(
                `Found ${matchingFiles.length} files with hash ${hash}! A single file was expected!`
            );
        }
        if (matchingFiles.length === 0) {
            throw new Error(`Could not find file with hash ${hash}!`);
        }

        return matchingFiles[0];
    }

    public async getFiles(query: Query): Promise<File[]> {
        const files: { [hash: string]: File } = {};

        const params: any[] = [];

        let sql1 =
            'SELECT files.hash, files.path, files.size, files.metadata, files.type FROM files WHERE 1 = 1';
        if (!query.includeInactive) {
            sql1 += ' AND active = 1';
        }
        if (query.filename) {
            const words = query.filename.split(' ');
            for (const word of words) {
                sql1 += ' AND path LIKE ? COLLATE NOCASE';
                params.push('%' + word + '%');
            }
        }
        if (query.status) {
            if (query.status === 'tagged') {
                sql1 +=
                    ' AND EXISTS (SELECT 1 FROM tags_files WHERE tags_files.hash = files.hash) ';
            }
            if (query.status === 'untagged') {
                sql1 +=
                    ' AND NOT EXISTS (SELECT 1 FROM tags_files WHERE tags_files.hash = files.hash) ';
            }
        }

        if (query.hash) {
            sql1 += ' AND hash = ? ';
            params.push(query.hash);
        }

        if (query.and || query.or || query.not) {
            sql1 +=
                ' AND (SELECT COUNT(*) FROM tags_files WHERE tags_files.hash = files.hash) > 0';
        }
        sql1 += this._generateTagFilterQuery(query.and, params, 'IN', 'AND');
        sql1 += this._generateTagFilterQuery(query.or, params, 'IN', 'OR');
        sql1 += this._generateTagFilterQuery(
            query.not,
            params,
            'NOT IN',
            'AND'
        );

        sql1 += ' ORDER BY path ';

        const each1 = (err: any, row: any) => {
            files[row.hash] = new File(
                row.hash,
                row.path,
                [],
                row.size,
                row.type,
                row.metadata ? JSON.parse(row.metadata) : {}
            );
        };

        const stmt = this._db.prepare(sql1);
        await stmt.eachAsync(params, each1);

        const sql2 =
            'SELECT tags.id, tags.name, tags_files.hash FROM tags_files JOIN tags ON tags.id = tags_files.id ORDER BY tags.name';
        const each2 = function (err: Error, row: any) {
            // Tag associations exist for inactive files but inactive files are
            // not in files list.
            if (typeof files[row.hash] !== 'undefined') {
                files[row.hash].tags.push(new Tag(row.id, row.name, 0));
            }
        };
        await this._db.eachAsync(sql2, each2);

        return _.values(files);
    }

    public updateMetadata(file: File, metadata: any): Promise<void> {
        const stmt = this._db.prepare(
            'UPDATE files SET metadata = ? WHERE hash = ?'
        );
        return stmt.runAsync(JSON.stringify(metadata), file.hash);
    }

    public async clearAllTagsAndTimecodesFromFile(hash: string): Promise<void> {
        const stmt1 = this._db.prepare('DELETE FROM tags_files WHERE hash = ?');
        await stmt1.runAsync(hash);

        const stmt2 = this._db.prepare(
            'DELETE FROM files_timecodes_tags WHERE id IN (SELECT id FROM files_timecodes WHERE hash = ?)'
        );
        await stmt2.runAsync(hash);

        const stmt3 = this._db.prepare(
            'DELETE FROM files_timecodes WHERE hash = ?'
        );
        await stmt3.runAsync(hash);
    }

    public async getScreenshotTime(hash: string): Promise<number> {
        const stmt = this._db.prepare(
            'SELECT time FROM screenshot_times_files WHERE hash = ?'
        );
        const result = await stmt.getAsync(hash);
        return result.time;
    }

    private _generateTagFilterQuery(
        ids: string | undefined,
        params: string[],
        opr1: string,
        opr2: string
    ): string {
        if (ids) {
            const splitIds = ids.split(',');
            splitIds.forEach((id) => {
                params.push(id);
            });
            const wheres = splitIds.map(() => {
                return (
                    ' files.hash ' +
                    opr1 +
                    ' (SELECT hash FROM tags_files WHERE id=?) '
                );
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

    public async mergeTags(
        sourceTagId: number,
        targetTagId: number
    ): Promise<void> {
        if (!sourceTagId) {
            return Promise.reject<void>(new Error('Source tag ID is required'));
        }
        if (!targetTagId) {
            return Promise.reject<void>(new Error('Target tag ID is required'));
        }

        // Some files might already be associated with both source and target tags. Updating
        // such tag associations would result in UNIQUE constraint failure.
        const updateStmt = this._db.prepare(
            'UPDATE tags_files SET id = ? WHERE id = ? AND hash NOT IN (SELECT hash FROM tags_files WHERE id = ?)'
        );
        await updateStmt.runAsync(targetTagId, sourceTagId, targetTagId);

        // Delete remaining associations to source tag. These were left because such files
        // were already associated with target tag.
        const deleteStmt = this._db.prepare(
            'DELETE FROM tags_files WHERE id = ?'
        );
        await deleteStmt.runAsync(sourceTagId);
    }

    public async deleteTag(tagId: number): Promise<void> {
        if (!tagId) {
            return Promise.reject<void>(new Error('Tag ID is required'));
        }

        const allTags = await this.getTags(new TagQuery([], true));
        const tag = allTags.find((t) => t.id === tagId);
        if (!tag) {
            return Promise.reject<void>(`Could not find tag with ID ${tagId}!`);
        }
        if (tag.associationCount !== 0) {
            return Promise.reject<void>(
                `Refusing to delete tag with ID ${tagId} as it is still associated with ${tag.associationCount} files!`
            );
        }

        const stmt = this._db.prepare('DELETE FROM tags WHERE id = ?');
        await stmt.runAsync(tagId);
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

        if (query && query.selectedTags && query.selectedTags.length > 0) {
            const wheres: string[] = [];
            query.selectedTags.forEach((tag) => {
                params.push(tag.id);
                wheres.push(' id = ? ');
            });

            const wheresJoined = wheres.join(' OR ');
            sql +=
                ` AND id IN (
                SELECT DISTINCT id
                FROM tags_files
                WHERE hash IN (
                    SELECT DISTINCT hash
                    FROM tags_files
                    WHERE ` +
                wheresJoined +
                `
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

    public async createNewLinkBetweenTagAndFile(
        inputTag: Tag,
        hash: string
    ): Promise<boolean> {
        const stmt = this._db.prepare('INSERT INTO tags_files VALUES (?, ?)');

        try {
            await stmt.runAsync(inputTag.id, hash);
            return true;
        } catch (err) {
            if ((<any>err).code !== 'SQLITE_CONSTRAINT') {
                throw err;
            }

            return false;
        }
    }

    public async addTimecodeToFile(
        timecode: Timecode,
        hash: string
    ): Promise<Timecode> {
        let timecodeId: number;
        if (!timecode.timecodeId) {
            const stmt1 = this._db.prepare(`INSERT INTO files_timecodes
            VALUES (
                null,
                ?,
                ?,
                ?
            )`);
            await stmt1.runAsync(hash, timecode.start, timecode.end);
            timecodeId = stmt1.lastID;
        } else {
            timecodeId = timecode.timecodeId;
        }

        const timecodeTags: TimecodeTag[] = [];
        for (const timecodeTag of timecode.timecodeTags) {
            const stmt2 = this._db.prepare(`INSERT INTO files_timecodes_tags
            VALUES (
                null,
                ?,
                ?
            )`);
            await stmt2.runAsync(timecodeId, timecodeTag.tag.id);
            timecodeTags.push(
                new TimecodeTag(timecodeId, stmt2.lastID, timecodeTag.tag)
            );
        }

        return new Timecode(
            timecodeId,
            hash,
            timecode.path,
            timecodeTags,
            timecode.start,
            timecode.end
        );
    }

    public async removeTagFromTimecode(
        hash: string,
        timecodeId: string,
        timecodeTagId: string
    ) {
        const stmt1 = this._db.prepare(`DELETE FROM files_timecodes_tags
            WHERE
                id = ?
        `);
        await stmt1.runAsync(timecodeTagId);

        const stmt2 = this._db.prepare(`DELETE FROM files_timecodes
            WHERE
                id = ? AND
                (
                    SELECT COUNT(*)
                    FROM files_timecodes_tags
                    WHERE timecode_id = ?
                )
                = 0
        `);
        await stmt2.runAsync(timecodeId, timecodeId);
    }

    public async updateTimecodeStartAndEnd(
        hash: string,
        timecode_id: number,
        timecode: Timecode
    ): Promise<void> {
        const stmt = this._db.prepare(`
            UPDATE files_timecodes
            SET start = ?, end = ?
            WHERE id = ?
        `);
        await stmt.runAsync(timecode.start, timecode.end, timecode_id);
    }

    public async getTimecodesForFile(hash: string): Promise<Timecode[]> {
        const timecodes: Timecode[] = [];

        const params1: any[] = [];
        params1.push(hash);

        const sql1 = `
            SELECT
                files_timecodes.id,
                files_timecodes.hash AS hash,
                files.path,
                files_timecodes.start,
                files_timecodes.end
            FROM files_timecodes
            JOIN files
            ON files.hash = files_timecodes.hash
            WHERE files_timecodes.hash = ?
            ORDER BY start
        `;

        const each1 = (err: Error, row: any) => {
            timecodes.push(
                new Timecode(row.id, row.hash, row.path, [], row.start, row.end)
            );
        };

        const stmt1 = this._db.prepare(sql1);
        await stmt1.eachAsync(params1, each1);

        const params2: any[] = [];
        params2.push(hash);

        const sql2 = `
            SELECT
                files_timecodes_tags.id AS id,
                files_timecodes_tags.timecode_id AS timecode_id,
                files_timecodes_tags.tag_id AS tag_id,
                tags.name AS tag_name
            FROM files_timecodes_tags
            JOIN files_timecodes
            ON files_timecodes.id = files_timecodes_tags.timecode_id
            JOIN tags
            ON tags.id = files_timecodes_tags.tag_id
            WHERE files_timecodes.hash = ?
            ORDER BY files_timecodes.start, tags.name
        `;

        const each2 = (err: Error, row: any) => {
            const timecode = timecodes.find(
                (t) => t.timecodeId === row.timecode_id
            );

            if (timecode) {
                timecode.timecodeTags.push(
                    new TimecodeTag(
                        row.timecode_id,
                        row.id,
                        new Tag(row.tag_id, row.tag_name, 0)
                    )
                );
            }
        };

        const stmt2 = this._db.prepare(sql2);
        await stmt2.eachAsync(params1, each2);

        const timecodesWithTags = timecodes.filter(
            (t) => t.timecodeTags.length > 0
        );
        return timecodesWithTags;
    }

    public async getTimecodes(query: Query): Promise<Timecode[]> {
        const timecodes: Timecode[] = [];

        const sql1 = `
            SELECT
                files_timecodes.id,
                files_timecodes.hash AS hash,
                files.path,
                files.active,
                files_timecodes.start,
                files_timecodes.end
            FROM files_timecodes
            JOIN files
            ON files.hash = files_timecodes.hash
            WHERE files.active = 1
            ORDER BY files.path, start
        `;

        const each1 = (err: Error, row: any) => {
            timecodes.push(
                new Timecode(row.id, row.hash, row.path, [], row.start, row.end)
            );
        };

        const stmt1 = this._db.prepare(sql1);
        await stmt1.eachAsync([], each1);

        const sql2 = `
            SELECT
                files_timecodes_tags.id AS id,
                files_timecodes_tags.timecode_id AS timecode_id,
                files_timecodes_tags.tag_id AS tag_id,
                tags.name AS tag_name
            FROM files_timecodes_tags
            JOIN files_timecodes
            ON files_timecodes.id = files_timecodes_tags.timecode_id
            JOIN tags
            ON tags.id = files_timecodes_tags.tag_id
            ORDER BY files_timecodes.start, tags.name
        `;

        const each2 = (err: Error, row: any) => {
            const timecode = timecodes.find(
                (t) => t.timecodeId === row.timecode_id
            );
            if (timecode) {
                timecode.timecodeTags.push(
                    new TimecodeTag(
                        row.timecode_id,
                        row.id,
                        new Tag(row.tag_id, row.tag_name, 0)
                    )
                );
            }
        };

        const stmt2 = this._db.prepare(sql2);
        await stmt2.eachAsync([], each2);

        let timecodesWithTags = timecodes.filter(
            (t) => t.timecodeTags.length > 0
        );

        if (query.filename) {
            timecodesWithTags = timecodesWithTags.filter((t) =>
                query.filename
                    ? t.path.toLocaleLowerCase().indexOf(query.filename) > -1
                    : -1
            );
        }

        if (query.and && query.and.length > 0) {
            const queryTagIds = query.and
                .split(',')
                .map((id) => parseInt(id, 10));
            timecodesWithTags = timecodesWithTags.filter((t) =>
                queryTagIds.every(
                    (queryTagId) =>
                        t.timecodeTags
                            .map((t2) => t2.tag.id)
                            .indexOf(queryTagId) >= 0
                )
            );
        }
        if (query.or && query.or.length > 0) {
            const queryTagIds = query.or
                .split(',')
                .map((id) => parseInt(id, 10));
            timecodesWithTags = timecodesWithTags.filter((t) =>
                queryTagIds.some(
                    (queryTagId) =>
                        t.timecodeTags
                            .map((t2) => t2.tag.id)
                            .indexOf(queryTagId) >= 0
                )
            );
        }
        if (query.not && query.not.length > 0) {
            const queryTagIds = query.not
                .split(',')
                .map((id) => parseInt(id, 10));
            timecodesWithTags = timecodesWithTags.filter((t) =>
                queryTagIds.every(
                    (queryTagId) =>
                        t.timecodeTags
                            .map((t2) => t2.tag.id)
                            .indexOf(queryTagId) < 0
                )
            );
        }

        return timecodesWithTags;
    }

    public deleteLinkBetweenTagAndFile(
        inputTag: number,
        inputFile: string
    ): Promise<void> {
        const stmt = this._db.prepare(
            'DELETE FROM tags_files WHERE id = ? AND hash = ?'
        );
        return stmt.runAsync(inputTag, inputFile);
    }

    public storeTimeForFileScreenshot(file: File, time: number) {
        const stmt = this._db.prepare(
            'INSERT OR REPLACE INTO screenshot_times_files (hash, time) VALUES (?, ?)'
        );
        return stmt.runAsync(file.hash, time);
    }

    public storeTimeForTimecodeScreenshot(timecode: Timecode, time: number) {
        const stmt = this._db.prepare(
            'INSERT OR REPLACE INTO screenshot_times_timecodes (id, time) VALUES (?, ?)'
        );
        return stmt.runAsync(timecode.timecodeId, time);
    }

    public storeTimeForTagScreenshot(tag: Tag, file: File, time: number) {
        const stmt = this._db.prepare(
            'INSERT OR REPLACE INTO screenshot_times_tags (id, hash, time) VALUES (?, ?, ?)'
        );
        return stmt.runAsync(tag.id, file.hash, time);
    }
}
