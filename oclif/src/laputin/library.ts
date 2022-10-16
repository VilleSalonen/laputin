// DELETE FROM files_timecodes_tags WHERE tag_id IS NULL;
// DELETE FROM screenshot_times_timecodes WHERE time IS NULL;
// CREATE TABLE IF NOT EXISTS "File" (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT UNIQUE NOT NULL, path TEXT UNIQUE NOT NULL, active INTEGER NOT NULL, size INTEGER NOT NULL, metadata TEXT NOT NULL, type TEXT NOT NULL);
// CREATE TABLE IF NOT EXISTS "Tag" (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
// CREATE TABLE IF NOT EXISTS "TagsOnFiles" (id INTEGER PRIMARY KEY AUTOINCREMENT, fileId INTEGER NOT NULL, tagId INTEGER NOT NULL, UNIQUE (fileId, tagId), FOREIGN KEY (fileId) REFERENCES File(id), FOREIGN KEY (tagId) REFERENCES Tag(id));
// CREATE INDEX TagsOnFiles_fileId ON TagsOnFiles(fileId);
// CREATE INDEX TagsOnFiles_tagId ON TagsOnFiles(tagId);
// CREATE TABLE IF NOT EXISTS "TimecodesOnFiles" (id INTEGER PRIMARY KEY AUTOINCREMENT, fileId INTEGER NOT NULL, start REAL NOT NULL, end REAL NOT NULL, FOREIGN KEY (fileId) REFERENCES File(id));
// CREATE TABLE IF NOT EXISTS "TagsOnTimecodes" (id INTEGER PRIMARY KEY AUTOINCREMENT, timecodeId INTEGER NOT NULL, tagId INTEGER NOT NULL, FOREIGN KEY (timecodeId) REFERENCES TimecodesOnFiles(id), FOREIGN KEY (tagId) REFERENCES Tag(id));
// CREATE TABLE IF NOT EXISTS "ScreenshotFile" (id INTEGER PRIMARY KEY, time REAL NOT NULL, FOREIGN KEY (id) REFERENCES Files(id));
// CREATE TABLE IF NOT EXISTS "ScreenshotTag" (id INTEGER PRIMARY KEY, fileId INTEGER NOT NULL, time REAL NOT NULL, FOREIGN KEY (id) REFERENCES Tag(id), FOREIGN KEY (fileId) REFERENCES File(id));
// CREATE TABLE IF NOT EXISTS "ScreenshotTimecode" (id INTEGER PRIMARY KEY, Time REAL NOT NULL);
// INSERT INTO File SELECT null, hash, path, active, size, metadata, type FROM files;
// DROP TABLE files;
// INSERT INTO Tag SELECT * FROM tags;
// DROP TABLE tags;
// INSERT INTO TagsOnFiles SELECT NULL, File.id, tags_files.id FROM tags_files JOIN File ON tags_files.hash = File.hash;
// DROP TABLE tags_files;
// INSERT INTO TimecodesOnFiles SELECT files_timecodes.id, File.id, files_timecodes.start, files_timecodes.end FROM files_timecodes JOIN File ON files_timecodes.hash = File.hash;
// DROP TABLE files_timecodes;
// INSERT INTO TagsOnTimecodes SELECT * FROM files_timecodes_tags;
// DROP TABLE files_timecodes_tags;
// INSERT INTO ScreenshotFile SELECT File.id, screenshot_times_files.time FROM screenshot_times_files JOIN File ON File.hash = screenshot_times_files.hash;
// DROP TABLE screenshot_times_files;
// INSERT INTO ScreenshotTag SELECT screenshot_times_tags.id, File.id, screenshot_times_tags.time FROM screenshot_times_tags JOIN File ON File.hash = screenshot_times_tags.hash;
// DROP TABLE screenshot_times_tags;
// INSERT INTO ScreenshotTimecode SELECT * FROM screenshot_times_timecodes;
// DROP TABLE screenshot_times_timecodes;
// VACUUM;

import { Prisma, PrismaClient } from '@prisma/client';
import bluebird = require('bluebird');

import sqlite3 = require('sqlite3');
bluebird.promisifyAll(sqlite3);

import * as path from 'path';
import _ = require('lodash');
import * as fs from 'fs';
import winston = require('winston');

import { Query } from './query.model';
import { File } from './file';
import { Tag, Timecode, TimecodeTag } from './tag';
import { TagQuery } from './tagquery.model';
import { FileTagLink } from './filetaglink';

export class Library {
    private _db: any;
    private prisma: PrismaClient;

    static async initialize(libraryPath: string): Promise<void> {
        if (
            !fs.existsSync(libraryPath) ||
            !fs.statSync(libraryPath).isDirectory()
        ) {
            throw new Error(
                `Directory ${libraryPath} is not a valid directory.`
            );
        }

        const dbPath = path.join(libraryPath, 'laputin.db');
        if (fs.existsSync(dbPath)) {
            throw new Error(
                `${libraryPath} has already been initialized as Laputin library. Refusing to re-initialize.`
            );
        }

        const db = new sqlite3.Database(dbPath);

        await (<any>db).runAsync(
            'CREATE TABLE IF NOT EXISTS "File" (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT UNIQUE NOT NULL, path TEXT UNIQUE NOT NULL, active INTEGER NOT NULL, size INTEGER NOT NULL, metadata TEXT NOT NULL, type TEXT NOT NULL);'
        );
        await (<any>db).runAsync(
            'CREATE TABLE IF NOT EXISTS "Tag" (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);'
        );
        await (<any>db).runAsync(
            'CREATE TABLE IF NOT EXISTS "TagsOnFiles" (id INTEGER PRIMARY KEY AUTOINCREMENT, fileId INTEGER NOT NULL, tagId INTEGER NOT NULL, UNIQUE (fileId, tagId), FOREIGN KEY (fileId) REFERENCES File(id), FOREIGN KEY (tagId) REFERENCES Tag(id));'
        );
        await (<any>db).runAsync(
            'CREATE INDEX TagsOnFiles_fileId ON TagsOnFiles(fileId);'
        );
        await (<any>db).runAsync(
            'CREATE INDEX TagsOnFiles_tagId ON TagsOnFiles(tagId);'
        );
        await (<any>db).runAsync(
            'CREATE TABLE IF NOT EXISTS "TimecodesOnFiles" (id INTEGER PRIMARY KEY AUTOINCREMENT, fileId INTEGER NOT NULL, start REAL NOT NULL, end REAL NOT NULL, FOREIGN KEY (fileId) REFERENCES File(id));'
        );
        await (<any>db).runAsync(
            'CREATE TABLE IF NOT EXISTS "TagsOnTimecodes" (id INTEGER PRIMARY KEY AUTOINCREMENT, timecodeId INTEGER NOT NULL, tagId INTEGER NOT NULL, FOREIGN KEY (timecodeId) REFERENCES TimecodesOnFiles(id), FOREIGN KEY (tagId) REFERENCES Tag(id));'
        );
        await (<any>db).runAsync(
            'CREATE TABLE IF NOT EXISTS "ScreenshotFile" (id INTEGER PRIMARY KEY, time REAL NOT NULL, FOREIGN KEY (id) REFERENCES Files(id));'
        );
        await (<any>db).runAsync(
            'CREATE TABLE IF NOT EXISTS "ScreenshotTag" (id INTEGER PRIMARY KEY, fileId INTEGER NOT NULL, time REAL NOT NULL, FOREIGN KEY (id) REFERENCES Tag(id), FOREIGN KEY (fileId) REFERENCES File(id));'
        );
        await (<any>db).runAsync(
            'CREATE TABLE IF NOT EXISTS "ScreenshotTimecode" (id INTEGER PRIMARY KEY, Time REAL NOT NULL);'
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

        const dbPath = path.join(this._libraryPath, 'laputin.db');
        if (!fs.existsSync(dbPath)) {
            winston.error(
                `${this._libraryPath} has not been initialized as Laputin library.`
            );
            process.exit(-1);
        }

        this.prisma = new PrismaClient({
            datasources: {
                db: {
                    url: `file:${dbPath}`,
                },
            },
        });
        this._db = new sqlite3.Database(dbPath);
    }

    public async addFile(file: File): Promise<void> {
        let existingFile;
        try {
            const files = await this.getFiles(
                new Query(
                    undefined,
                    undefined,
                    undefined,
                    [file.hash],
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

        const metadata = JSON.stringify(
            existingFile
                ? { ...existingFile.metadata, ...file.metadata }
                : file.metadata
        );

        try {
            await this.prisma.file.upsert({
                where: {
                    hash: file.hash,
                },
                update: {
                    path: file.path,
                    active: 1,
                    size: file.size,
                    metadata: metadata,
                    type: file.type,
                },
                create: {
                    hash: file.hash,
                    path: file.path,
                    active: 1,
                    size: file.size,
                    metadata: metadata,
                    type: file.type,
                },
            });
        } catch (err) {
            winston.error(`Upserting ${file.hash} ${file.path}`, err);
        }
    }

    public async deactivateFile(file: File): Promise<void> {
        await this.prisma
            .$queryRaw`UPDATE File SET active = 0 WHERE path = ${file.path}`;
    }

    public async deactivateAll(): Promise<void> {
        await this.prisma.$queryRaw`UPDATE File SET active = 0`;
    }

    public async getFile(hash: string): Promise<File> {
        const query = new Query(
            undefined,
            undefined,
            undefined,
            [hash],
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
        let fileNameClause = Prisma.empty;
        if (query.filename) {
            fileNameClause = query.filename
                .split(' ')
                .map((word) => `%${word}%`)
                .reduce(
                    (query, word) =>
                        Prisma.sql` ${query} AND path LIKE ${word} COLLATE NOCASE `,
                    Prisma.empty
                );
        }

        let pathsClause = Prisma.empty;
        if (query.paths && query.paths.length) {
            const paths = query.paths.reduce(
                (query, path, currentIndex) =>
                    currentIndex === 0
                        ? Prisma.sql` ${query} path = ${path} COLLATE NOCASE `
                        : Prisma.sql` ${query} OR path = ${path} COLLATE NOCASE `,
                Prisma.empty
            );

            pathsClause = Prisma.sql` AND (${paths})`;
        }

        let statusClause = Prisma.empty;
        if (query.status) {
            if (query.status === 'tagged') {
                statusClause = Prisma.sql` AND EXISTS (SELECT 1 FROM TagsOnFiles WHERE TagsOnFiles.fileId = File.id) `;
            }
            if (query.status === 'untagged') {
                statusClause = Prisma.sql` AND NOT EXISTS (SELECT 1 FROM TagsOnFiles WHERE TagsOnFiles.fileId = File.id) `;
            }
        }

        let hashesClause = Prisma.empty;
        if (query.hash && query.hash.length) {
            if (typeof query.hash === 'string') {
                hashesClause = Prisma.sql` AND hash = ${query.hash} `;
            } else if (Array.isArray(query.hash)) {
                const hashes = query.hash.reduce(
                    (query, hash, currentIndex) =>
                        currentIndex === 0
                            ? Prisma.sql` ${query} hash = ${hash} `
                            : Prisma.sql` ${query} OR hash = ${hash} `,
                    Prisma.empty
                );

                hashesClause = Prisma.sql` AND (${hashes})`;
            }
        }

        let filesSql = Prisma.sql`
            SELECT File.id, File.hash, File.path, File.size, File.metadata, File.type
            FROM File
            WHERE 1 = 1
            ${this.formatActiveClause(query)}
            ${fileNameClause}
            ${pathsClause}
            ${statusClause}
            ${hashesClause}
            ${this._generateTagFilterQueryAnd(query.and)}
            ${this._generateTagFilterQueryOr(query.or)}
            ${this._generateTagFilterQueryNot(query.not)}
            ORDER BY File.path`;

        const rawResults = await this.prisma.$queryRaw<any[]>(filesSql);
        const files: Map<number, File> = new Map<number, File>(
            rawResults.map((row) => [
                row.id,
                new File(
                    row.id,
                    row.hash,
                    row.path,
                    [],
                    Number(row.size),
                    row.type,
                    row.metadata ? JSON.parse(row.metadata) : {}
                ),
            ])
        );
        const fileIds = rawResults.map((r) => r.id);

        const tagsOnFiles = await this.prisma.tagsOnFiles.findMany({
            where: { fileId: { in: fileIds } },
            include: {
                Tag: true,
            },
        });
        tagsOnFiles.forEach((tagOnFile) => {
            if (files.has(tagOnFile.fileId)) {
                (<File>files.get(tagOnFile.fileId)).tags.push(
                    new Tag(tagOnFile.Tag.id, tagOnFile.Tag.name, 0)
                );
            }
        });

        return Array.from(files.values());
    }

    private formatActiveClause(query: Query): Prisma.Sql {
        return !query.includeInactive
            ? Prisma.sql` AND active = 1 `
            : Prisma.sql``;
    }

    public async updateMetadata(file: File, metadata: any): Promise<void> {
        await this.prisma.file.update({
            where: {
                id: file.fileId,
            },
            data: {
                metadata: JSON.stringify(metadata),
            },
        });
    }

    public async clearAllTagsAndTimecodesFromFile(
        fileId: number
    ): Promise<void> {
        await this.prisma.tagsOnFiles.deleteMany({
            where: {
                fileId: fileId,
            },
        });

        await this.prisma.tagsOnTimecodes.deleteMany({
            where: {
                TimecodesOnFiles: {
                    fileId: fileId,
                },
            },
        });

        await this.prisma.timecodesOnFiles.deleteMany({
            where: {
                fileId: fileId,
            },
        });
    }

    private _generateTagFilterQueryAnd(ids: string | undefined): Prisma.Sql {
        if (!ids) {
            return Prisma.empty;
        }
        const wheres = ids
            .split(',')
            .reduce(
                (query, id, currentIndex) =>
                    currentIndex === 0
                        ? Prisma.sql` ${query} File.id IN (SELECT fileId FROM TagsOnFiles WHERE tagId = ${id}) `
                        : Prisma.sql` ${query} AND File.id IN (SELECT fileId FROM TagsOnFiles WHERE tagId = ${id}) `,
                Prisma.empty
            );

        return Prisma.sql` AND ( ${wheres} ) `;
    }

    private _generateTagFilterQueryOr(ids: string | undefined): Prisma.Sql {
        if (!ids) {
            return Prisma.empty;
        }
        const wheres = ids
            .split(',')
            .reduce(
                (query, id, currentIndex) =>
                    currentIndex === 0
                        ? Prisma.sql` ${query} File.id IN (SELECT fileId FROM TagsOnFiles WHERE tagId = ${id}) `
                        : Prisma.sql` ${query} OR File.id IN (SELECT fileId FROM TagsOnFiles WHERE tagId = ${id}) `,
                Prisma.empty
            );

        return Prisma.sql` AND ( ${wheres} ) `;
    }

    private _generateTagFilterQueryNot(ids: string | undefined): Prisma.Sql {
        if (!ids) {
            return Prisma.empty;
        }
        const wheres = ids
            .split(',')
            .reduce(
                (query, id, currentIndex) =>
                    currentIndex === 0
                        ? Prisma.sql` ${query} File.id NOT IN (SELECT fileId FROM TagsOnFiles WHERE tagId = ${id}) `
                        : Prisma.sql` ${query} AND File.id NOT IN (SELECT fileId FROM TagsOnFiles WHERE tagId = ${id}) `,
                Prisma.empty
            );

        return Prisma.sql` AND ( ${wheres} ) `;
    }

    public async createNewTag(tagName: string): Promise<Tag> {
        if (!tagName) {
            return Promise.reject<Tag>(new Error('Tag name is required'));
        }

        const createdTag = await this.prisma.tag.create({
            data: {
                name: tagName,
            },
        });

        return new Tag(createdTag.id, createdTag.name, 0);
    }

    public async renameTag(tagId: number, tagName: string): Promise<Tag> {
        if (!tagId) {
            return Promise.reject<Tag>(new Error('Tag ID is required'));
        }
        if (!tagName) {
            return Promise.reject<Tag>(new Error('Tag name is required'));
        }

        const updatedTag = await this.prisma.tag.update({
            where: {
                id: tagId,
            },
            data: {
                name: tagName,
            },
        });

        return new Tag(updatedTag.id, updatedTag.name, 0);
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

        await this.prisma.$executeRaw`
            UPDATE TagsOnFiles
            SET tagId = ${targetTagId}
            WHERE
                tagId = ${sourceTagId} AND
                fileId NOT IN (
                    SELECT fileId FROM TagsOnFiles WHERE tagId = ${targetTagId}
                )
        `;

        await this.prisma.tagsOnFiles.delete({
            where: {
                id: sourceTagId,
            },
        });
    }

    public async deleteTag(tagId: number): Promise<void> {
        if (!tagId) {
            return Promise.reject<void>(new Error('Tag ID is required'));
        }

        await this.prisma.tagsOnFiles.deleteMany({
            where: {
                tagId: tagId,
            },
        });
        await this.prisma.tagsOnTimecodes.deleteMany({
            where: {
                tagId: tagId,
            },
        });
        await this.prisma.tag.delete({
            where: {
                id: tagId,
            },
        });
    }

    public async getAllTags(): Promise<Tag[]> {
        return this.getTags(TagQuery.allUnassociated());
    }

    public async getTags(query: TagQuery): Promise<Tag[]> {
        /*const results = await this.prisma.tag.findMany({
            include: {
                _count: {
                    select: { TagsOnFiles: true },
                },
            },
            where: {
                name: { contains: query.tagName },
                TagsOnFiles: { some: {} },
            },
        });

        return results.map(
            (result) =>
                new Tag(result.id, result.name, result._count.TagsOnFiles)
        );*/

        const params: any[] = [];
        let sql = `
            SELECT id, name, (
                SELECT COUNT(*)
                FROM TagsOnFiles
                JOIN File ON TagsOnFiles.fileId = File.id
                WHERE
                    TagsOnFiles.tagId = Tag.id AND
                    File.active = 1
            ) AS Count
            FROM Tag
            WHERE
        `;

        if (query && query.unassociated) {
            sql += ' count >= 0 ';
        } else {
            sql += ' count > 0 ';
        }

        if (query && query.andTags && query.andTags.length > 0) {
            const wheres: string[] = [];
            query.andTags.forEach((tagId) => {
                params.push(tagId);
                wheres.push(' SELECT fileId FROM TagsOnFiles WHERE tagId = ? ');
            });

            const wheresJoined = wheres.join(' INTERSECT ');
            sql += ` AND tagId IN (
                SELECT DISTINCT tagId
                FROM TagsOnFiles
                WHERE fileId IN (
                    SELECT DISTINCT fileId
                    FROM TagsOnFiles
                    WHERE fileId IN (${wheresJoined})
                )
            )`;

            const selectedIds: string[] = [];
            query.andTags.forEach((tagId) => {
                params.push(tagId);
                selectedIds.push(' ? ');
            });

            sql += ' AND id NOT IN (' + selectedIds.join(',') + ')';
        }

        if (query && query.tagName) {
            sql += ' AND name LIKE ?';
            params.push('%' + query.tagName + '%');
        }

        sql += ' ORDER BY name ';

        const tags: Tag[] = [];
        const each = (err: Error, row: any) => {
            tags.push(new Tag(row.id, row.name, row.count));
        };

        const stmt = this._db.prepare(sql);
        await stmt.eachAsync(params, each);
        return tags;
    }

    public async createNewLinksBetweenTagsAndFiles(
        inputTags: Tag[],
        files: File[]
    ): Promise<FileTagLink[]> {
        if (inputTags && inputTags.length === 0) {
            throw new Error('No tags provided for linking');
        }
        if (files && files.length === 0) {
            throw new Error('No files provided for linking');
        }

        const existingLinks = await this.getExistingLinksBetweenTagsAndFiles(
            inputTags,
            files
        );
        return await this.createMissingLinksBetweenTagsAndFiles(
            inputTags,
            files,
            existingLinks
        );
    }

    private async getExistingLinksBetweenTagsAndFiles(
        inputTags: Tag[],
        files: File[]
    ): Promise<Map<number, Set<number>>> {
        const wheres = [];
        for (const inputTag of inputTags) {
            for (const file of files) {
                wheres.push({ fileId: file.fileId, tagId: inputTag.id });
            }
        }

        const existingLinks = await this.prisma.tagsOnFiles.findMany({
            where: { OR: wheres },
        });

        const existingLinksMap: Map<number, Set<number>> = new Map<
            number,
            Set<number>
        >();
        existingLinks.forEach((result) => {
            if (!existingLinksMap.has(result.fileId)) {
                existingLinksMap.set(result.fileId, new Set<number>());
            }
            // Map entry is guaranteed to exist as we just checked and/or created it.
            (<Set<number>>existingLinksMap.get(result.fileId)).add(
                result.tagId
            );
        });

        return existingLinksMap;
    }

    private async createMissingLinksBetweenTagsAndFiles(
        inputTags: Tag[],
        files: File[],
        existingLinks: Map<number, Set<number>>
    ) {
        const insertPrepares: string[] = [];
        const insertParams: any[] = [];
        const returnResults: FileTagLink[] = [];
        for (const inputTag of inputTags) {
            for (const file of files) {
                if (
                    !existingLinks.has(file.fileId) ||
                    !(<Set<number>>existingLinks.get(file.fileId)).has(
                        inputTag.id
                    )
                ) {
                    winston.verbose(
                        `${file.path} did not have ${inputTag.name}`
                    );
                    insertPrepares.push('(NULL, ?, ?)');
                    insertParams.push(file.fileId);
                    insertParams.push(inputTag.id);
                    returnResults.push(new FileTagLink(file, inputTag));
                } else {
                    winston.verbose(
                        `${file.path} already HAD ${inputTag.name}`
                    );
                }
            }
        }

        if (insertPrepares.length === 0) {
            return [];
        }

        const insert = `INSERT INTO TagsOnFiles VALUES ${insertPrepares.join(
            ','
        )}`;
        await this.prisma.$queryRawUnsafe(insert, ...insertParams);
        return returnResults;
    }

    public async createNewLinkBetweenTagAndFile(
        inputTag: Tag,
        hash: string
    ): Promise<boolean> {
        const file = await this.getFile(hash);

        const stmt = this._db.prepare(
            'INSERT INTO TagsOnFiles VALUES (NULL, ?, ?)'
        );

        try {
            await stmt.runAsync(file.fileId, inputTag.id);
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
        const file = await this.getFile(hash);

        let timecodeId: number;
        if (!timecode.timecodeId) {
            const stmt1 = this._db.prepare(`INSERT INTO TimecodesOnFiles
            VALUES (
                null,
                ?,
                ?,
                ?
            )`);
            await stmt1.runAsync(file.fileId, timecode.start, timecode.end);
            timecodeId = stmt1.lastID;
        } else {
            timecodeId = timecode.timecodeId;
        }

        const timecodeTags: TimecodeTag[] = [];
        for (const timecodeTag of timecode.timecodeTags) {
            const stmt2 = this._db.prepare(`INSERT INTO TagsOnTimecodes
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
            file.hash,
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
        const stmt1 = this._db.prepare(`DELETE FROM TagsOnTimecodes
            WHERE
                id = ?
        `);
        await stmt1.runAsync(timecodeTagId);

        const stmt2 = this._db.prepare(`DELETE FROM TimecodesOnFiles
            WHERE
                id = ? AND
                (
                    SELECT COUNT(*)
                    FROM TagsOnTimecodes
                    WHERE timecodeId = ?
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
            UPDATE TimecodesOnFiles
            SET start = ?, end = ?
            WHERE id = ?
        `);
        await stmt.runAsync(timecode.start, timecode.end, timecode_id);
    }

    public async getTimecodesForFile(hash: string): Promise<Timecode[]> {
        const file = await this.getFile(hash);

        const timecodes: Timecode[] = [];

        const params1: any[] = [];
        params1.push(file.fileId);

        const sql1 = `
            SELECT
                TimecodesOnFiles.id,
                TimecodesOnFiles.fileId AS fileId,
                File.path,
                TimecodesOnFiles.start,
                TimecodesOnFiles.end
            FROM TimecodesOnFiles
            JOIN File
            ON File.id = TimecodesOnFiles.fileId
            WHERE TimecodesOnFiles.fileId = ?
            ORDER BY start
        `;

        const each1 = (err: Error, row: any) => {
            timecodes.push(
                new Timecode(
                    row.id,
                    row.fileId,
                    row.path,
                    [],
                    row.start,
                    row.end
                )
            );
        };

        const stmt1 = this._db.prepare(sql1);
        await stmt1.eachAsync(params1, each1);

        const params2: any[] = [];
        params2.push(file.fileId);

        const sql2 = `
            SELECT
                TagsOnTimecodes.id AS id,
                TagsOnTimecodes.timecodeId AS timecodeId,
                TagsOnTimecodes.tagId AS tagId,
                Tag.name AS tagName
            FROM TagsOnTimecodes
            JOIN TimecodesOnFiles
            ON TimecodesOnFiles.id = TagsOnTimecodes.timecodeId
            JOIN Tag
            ON Tag.id = TagsOnTimecodes.tagId
            WHERE TimecodesOnFiles.fileId = ?
            ORDER BY TimecodesOnFiles.start, Tag.name
        `;

        const each2 = (err: Error, row: any) => {
            const timecode = timecodes.find(
                (t) => t.timecodeId === row.timecodeId
            );

            if (timecode) {
                timecode.timecodeTags.push(
                    new TimecodeTag(
                        row.timecodeId,
                        row.id,
                        new Tag(row.tagId, row.tagName, 0)
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
                TimecodesOnFiles.id,
                File.hash AS hash,
                File.path,
                File.active,
                TimecodesOnFiles.Start,
                TimecodesOnFiles.End
            FROM TimecodesOnFiles
            JOIN File
            ON File.id = TimecodesOnFiles.fileId
            WHERE File.active = 1
            ORDER BY File.path, start
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
                TagsOnTimecodes.id AS id,
                TagsOnTimecodes.timecodeId AS timecodeId,
                TagsOnTimecodes.tagId AS tagId,
                Tag.name AS tagName
            FROM TagsOnTimecodes
            JOIN TimecodesOnFiles
            ON TimecodesOnFiles.id = tagsOnTimecodes.timecodeId
            JOIN Tag
            ON Tag.id = TagsOnTimecodes.tagId
            ORDER BY TimecodesOnFiles.start, Tag.name
        `;

        const each2 = (err: Error, row: any) => {
            const timecode = timecodes.find(
                (t) => t.timecodeId === row.timecodeId
            );
            if (timecode) {
                timecode.timecodeTags.push(
                    new TimecodeTag(
                        row.timecodeId,
                        row.id,
                        new Tag(row.tagId, row.tagName, 0)
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
                    ? // Currently timecode query only supports single filename.
                      t.path.toLocaleLowerCase().indexOf(query.filename[0]) > -1
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

    public async deleteLinksBetweenTagsAndFiles(
        inputTags: Tag[],
        files: File[]
    ): Promise<FileTagLink[]> {
        if (inputTags && inputTags.length === 0) {
            throw new Error('No tags provided for linking');
        }
        if (files && files.length === 0) {
            throw new Error('No files provided for linking');
        }

        const selectPrepares: string[] = [];
        const selectParams: any[] = [];
        for (const inputTag of inputTags) {
            for (const file of files) {
                selectPrepares.push('(fileId = ? AND TagId = ?)');
                selectParams.push(file.fileId);
                selectParams.push(inputTag.id);
            }
        }

        const select = `SELECT * FROM TagsOnFiles WHERE ${selectPrepares.join(
            ' OR '
        )}`;
        const selectStmt = this._db.prepare(select);

        const selectResults: Map<string, Set<number>> = new Map<
            string,
            Set<number>
        >();
        const each = (err: Error, row: any) => {
            if (!selectResults.has(row.fileId)) {
                selectResults.set(row.fileId, new Set<number>());
            }
            // Map entry is guaranteed to exist as we just checked and/or created it.
            (<Set<number>>selectResults.get(row.fileId)).add(row.TagId);
        };
        await selectStmt.eachAsync(selectParams, each);

        const deletePrepares: string[] = [];
        const deleteParams: any[] = [];
        const results: FileTagLink[] = [];
        for (const inputTag of inputTags) {
            for (const file of files) {
                if (
                    selectResults.has(file.hash) &&
                    (<Set<number>>selectResults.get(file.hash)).has(inputTag.id)
                ) {
                    winston.verbose(
                        `${file.path} already had ${inputTag.name}`
                    );
                    deletePrepares.push('(fileId = ? AND tagId = ?)');
                    deleteParams.push(file.fileId);
                    deleteParams.push(inputTag.id);
                    results.push(new FileTagLink(file, inputTag));
                } else {
                    winston.verbose(
                        `${file.path} did NOT HAVE ${inputTag.name}`
                    );
                }
            }
        }

        if (deletePrepares.length === 0) {
            return [];
        }

        const deleteSql = `DELETE FROM TagsOnFiles WHERE ${deletePrepares.join(
            ' OR '
        )}`;
        const deleteStmt = this._db.prepare(deleteSql);

        try {
            await deleteStmt.runAsync(deleteParams);
            return results;
        } catch (err) {
            if ((<any>err).code !== 'SQLITE_CONSTRAINT') {
                throw err;
            }

            return [];
        }
    }

    public async deleteLinkBetweenTagAndFile(
        inputTag: number,
        inputFile: string
    ): Promise<void> {
        const file = await this.getFile(inputFile);

        const stmt = this._db.prepare(
            'DELETE FROM TagsOnFiles WHERE fileId = ? AND tagId = ?'
        );
        return stmt.runAsync(file.fileId, inputTag);
    }

    public storeTimeForFileScreenshot(file: File, time: number) {
        const stmt = this._db.prepare(
            'INSERT OR REPLACE INTO ScreenshotFile (id, time) VALUES (?, ?)'
        );
        return stmt.runAsync(file.fileId, time);
    }

    public storeTimeForTimecodeScreenshot(timecode: Timecode, time: number) {
        const stmt = this._db.prepare(
            'INSERT OR REPLACE INTO ScreenshotTimecode (Id, Time) VALUES (?, ?)'
        );
        return stmt.runAsync(timecode.timecodeId, time);
    }

    public storeTimeForTagScreenshot(tag: Tag, file: File, time: number) {
        const stmt = this._db.prepare(
            'INSERT OR REPLACE INTO ScreenshotTag (Id, fileId, Time) VALUES (?, ?, ?)'
        );
        return stmt.runAsync(tag.id, file.fileId, time);
    }
}
