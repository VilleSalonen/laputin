import { Prisma, PrismaClient } from '@prisma/client';
import fs = require('fs');
import winston = require('winston');

import { Query } from './query.model';
import { File } from './file';
import { Tag, Timecode, TimecodeTag } from './tag';
import { TagQuery } from './tagquery.model';
import { FileTagLink } from './filetaglink';

export class Library {
    private prisma: PrismaClient;

    static async initialize(libraryPath: string): Promise<void> {
        if (!fs.existsSync(libraryPath) || !fs.statSync(libraryPath).isDirectory()) {
            throw new Error(`Directory ${libraryPath} is not a valid directory.`);
        }
    }

    constructor(private _libraryPath: string) {
        if (!fs.existsSync(this._libraryPath) || !fs.statSync(this._libraryPath).isDirectory()) {
            throw new Error(`Directory ${this._libraryPath} is not a valid directory.`);
        }

        this.prisma = new PrismaClient();
    }

    public async addFile(file: File): Promise<File> {
        const existingFile = await this.getFileByHash(file.hash);

        const metadata = existingFile ? { ...existingFile.metadata, ...file.metadata } : file.metadata;

        const createdFile = await this.prisma.file.upsert({
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

        const createdFileWithTags = await this.getFileById(createdFile.id);
        if (!createdFileWithTags) {
            throw new Error('File was not created WTF');
        }

        return createdFileWithTags;
    }

    public async deactivateFile(file: File): Promise<void> {
        await this.prisma.file.update({
            where: {
                id: file.fileId,
            },
            data: {
                active: 0,
            },
        });
    }

    public async getFile(hash: string): Promise<File> {
        const query = new Query(undefined, undefined, undefined, [hash], undefined, undefined, undefined, undefined);

        const matchingFiles = await this.getFiles(query);
        if (matchingFiles.length > 1) {
            throw new Error(`Found ${matchingFiles.length} files with hash ${hash}! A single file was expected!`);
        }
        if (matchingFiles.length === 0) {
            throw new Error(`Could not find file with hash ${hash}!`);
        }

        return matchingFiles[0];
    }

    public getFileById(fileId: number): Promise<File | null> {
        return this.getFileViaSql(
            Prisma.sql`
                SELECT file.id, file.hash, file.path, file.size, file.metadata, file.type
                FROM file
                WHERE id = ${fileId}`
        );
    }

    public getFileByHash(hash: string): Promise<File | null> {
        return this.getFileViaSql(
            Prisma.sql`
                SELECT file.id, file.hash, file.path, file.size, file.metadata, file.type
                FROM file
                WHERE hash = ${hash}`
        );
    }

    public async getFiles(query: Query): Promise<File[]> {
        let fileNameClause = Prisma.empty;
        if (query.filename) {
            fileNameClause = query.filename
                .split(' ')
                .map((word) => `%${word}%`)
                .reduce((query, word) => Prisma.sql` ${query} AND path ILIKE ${word} `, Prisma.empty);
        }

        let pathsClause = Prisma.empty;
        if (query.paths && query.paths.length) {
            const paths = query.paths.reduce(
                (query, path, currentIndex) =>
                    currentIndex === 0
                        ? Prisma.sql` ${query} path = ${path} `
                        : Prisma.sql` ${query} OR path = ${path} `,
                Prisma.empty
            );

            pathsClause = Prisma.sql` AND (${paths})`;
        }

        let statusClause = Prisma.empty;
        if (query.status) {
            if (query.status === 'tagged') {
                statusClause = Prisma.sql` AND EXISTS (SELECT 1 FROM tags_on_files WHERE tags_on_files.file_id = file.id) `;
            }
            if (query.status === 'untagged') {
                statusClause = Prisma.sql` AND NOT EXISTS (SELECT 1 FROM tags_on_files WHERE tags_on_files.file_id = file.id) `;
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

        const filesSql = Prisma.sql`
            SELECT file.id, file.hash, file.path, file.size, file.metadata, file.type
            FROM file
            WHERE 1 = 1
            ${this.formatActiveClause(query)}
            ${fileNameClause}
            ${pathsClause}
            ${statusClause}
            ${hashesClause}
            ${this._generateTagFilterQueryAnd(query.and)}
            ${this._generateTagFilterQueryOr(query.or)}
            ${this._generateTagFilterQueryNot(query.not)}
            ORDER BY file.path`;

        return this.getFilesViaSql(filesSql);
    }

    private async getFilesViaSql(filesSql: Prisma.Sql): Promise<File[]> {
        const rawResults = await this.prisma.$queryRaw<any[]>(filesSql);
        const files: Map<number, File> = new Map<number, File>(
            rawResults.map((row) => [
                row.id,
                new File(row.id, row.hash, row.path, [], Number(row.size), row.type, row.metadata ?? {}),
            ])
        );
        const fileIds = rawResults.map((r) => r.id);

        const tagsOnFiles = await this.prisma.tagsOnFiles.findMany({
            where: {
                fileId: { in: fileIds },
            },
            include: {
                Tag: true,
            },
            orderBy: [
                {
                    Tag: {
                        name: 'asc',
                    },
                },
            ],
        });

        tagsOnFiles.forEach((tagOnFile) => {
            if (files.has(tagOnFile.fileId)) {
                (<File>files.get(tagOnFile.fileId)).tags.push(new Tag(tagOnFile.Tag.id, tagOnFile.Tag.name, 0));
            }
        });

        return Array.from(files.values());
    }

    private async getFileViaSql(fileSql: Prisma.Sql): Promise<File | null> {
        const matches = await this.getFilesViaSql(fileSql);
        return matches && matches.length > 0 ? matches[0] : null;
    }

    private formatActiveClause(query: Query): Prisma.Sql {
        return !query.includeInactive ? Prisma.sql` AND active = 1 ` : Prisma.sql``;
    }

    public async updateMetadata(file: File, metadata: any): Promise<void> {
        await this.prisma.file.update({
            where: {
                id: file.fileId,
            },
            data: {
                metadata: metadata,
            },
        });
    }

    public async clearAllTagsAndTimecodesFromFile(fileId: number): Promise<void> {
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
            .map((idStr) => parseInt(idStr))
            .reduce(
                (query, id, currentIndex) =>
                    currentIndex === 0
                        ? Prisma.sql` ${query} file.id IN (SELECT tags_on_files.file_id FROM tags_on_files WHERE tags_on_files.tag_id = ${id}) `
                        : Prisma.sql` ${query} AND file.id IN (SELECT tags_on_files.file_id FROM tags_on_files WHERE tags_on_files.tag_id = ${id}) `,
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
            .map((idStr) => parseInt(idStr))
            .reduce(
                (query, id, currentIndex) =>
                    currentIndex === 0
                        ? Prisma.sql` ${query} file.id IN (SELECT tags_on_files.file_id FROM tags_on_files WHERE tags_on_files.tag_id = ${id}) `
                        : Prisma.sql` ${query} OR file.id IN (SELECT tags_on_files.file_id FROM tags_on_files WHERE tags_on_files.tag_id = ${id}) `,
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
            .map((idStr) => parseInt(idStr))
            .reduce(
                (query, id, currentIndex) =>
                    currentIndex === 0
                        ? Prisma.sql` ${query} file.id NOT IN (SELECT tags_on_files.file_id FROM tags_on_files WHERE tags_on_files.tag_id = ${id}) `
                        : Prisma.sql` ${query} AND file.id NOT IN (SELECT tags_on_files.file_id FROM tags_on_files WHERE tags_on_files.tag_id = ${id}) `,
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

    public async mergeTags(sourceTagId: number, targetTagId: number): Promise<void> {
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
        const unassociatedClause =
            query && query.unassociated
                ? Prisma.sql``
                : Prisma.sql` AND EXISTS(SELECT id FROM tags_on_files WHERE tags_on_files.tag_id = tag."id") `;

        /*if (query && query.andTags && query.andTags.length > 0) {
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
        */

        const tagsSql = Prisma.sql`
            SELECT tag.id, tag.name, CAST((
                SELECT COUNT(*)
                FROM tags_on_files
                JOIN file ON tags_on_files.file_id = file.id
                WHERE
                    tags_on_files.tag_id = tag.id AND
                    file.active = 1
            ) AS int) AS count
            FROM tag
            WHERE
                1 = 1
                ${unassociatedClause}
            ORDER BY tag.name
        `;

        const rawResults = await this.prisma.$queryRaw<any[]>(tagsSql);
        const tags: Tag[] = rawResults.map((row) => new Tag(row.id, row.name, row.count));

        return tags;
    }

    public async createNewLinksBetweenTagsAndFiles(inputTags: Tag[], files: File[]): Promise<FileTagLink[]> {
        if (inputTags && inputTags.length === 0) {
            throw new Error('No tags provided for linking');
        }
        if (files && files.length === 0) {
            throw new Error('No files provided for linking');
        }

        const existingLinks = await this.getExistingLinksBetweenTagsAndFiles(inputTags, files);
        return await this.createMissingLinksBetweenTagsAndFiles(inputTags, files, existingLinks);
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

        const existingLinksMap: Map<number, Set<number>> = new Map<number, Set<number>>();
        existingLinks.forEach((result) => {
            if (!existingLinksMap.has(result.fileId)) {
                existingLinksMap.set(result.fileId, new Set<number>());
            }
            // Map entry is guaranteed to exist as we just checked and/or created it.
            (<Set<number>>existingLinksMap.get(result.fileId)).add(result.tagId);
        });

        return existingLinksMap;
    }

    private async createMissingLinksBetweenTagsAndFiles(
        inputTags: Tag[],
        files: File[],
        existingLinks: Map<number, Set<number>>
    ) {
        const insertParams: any[] = [];
        const returnResults: FileTagLink[] = [];
        for (const inputTag of inputTags) {
            for (const file of files) {
                if (
                    !existingLinks.has(file.fileId) ||
                    !(<Set<number>>existingLinks.get(file.fileId)).has(inputTag.id)
                ) {
                    insertParams.push({ fileId: file.fileId, tagId: inputTag.id });
                    returnResults.push(new FileTagLink(file, inputTag));
                }
            }
        }

        if (returnResults.length === 0) {
            return [];
        }

        await this.prisma.tagsOnFiles.createMany({
            data: insertParams,
        });
        return returnResults;
    }

    public async createNewLinkBetweenTagAndFile(inputTag: Tag, hash: string): Promise<void> {
        const file = await this.getFile(hash);

        try {
            await this.prisma.tagsOnFiles.upsert({
                where: {
                    fileId_tagId: {
                        tagId: inputTag.id,
                        fileId: file.fileId,
                    },
                },
                update: {},
                create: {
                    tagId: inputTag.id,
                    fileId: file.fileId,
                },
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                return;
            }
            throw e;
        }
    }

    public async addTimecodeToFile(timecode: Timecode, hash: string): Promise<Timecode> {
        const file = await this.getFile(hash);

        let timecodeId: number;
        if (!timecode.timecodeId) {
            const createdTimecode = await this.prisma.timecodesOnFiles.create({
                data: {
                    fileId: file.fileId,
                    start: timecode.start,
                    end: timecode.end,
                },
            });
            timecodeId = createdTimecode.id;
        } else {
            timecodeId = timecode.timecodeId;
        }

        const timecodeTags: TimecodeTag[] = [];
        for (const timecodeTag of timecode.timecodeTags) {
            const createdTagOnTimecode = await this.prisma.tagsOnTimecodes.create({
                data: {
                    timecodeId: timecodeId,
                    tagId: timecodeTag.tag.id,
                },
            });
            timecodeTags.push(new TimecodeTag(timecodeId, createdTagOnTimecode.id, timecodeTag.tag));
        }

        return new Timecode(timecodeId, file.fileId, timecode.path, timecodeTags, timecode.start, timecode.end);
    }

    public async removeTagFromTimecode(hash: string, timecodeId: string, timecodeTagId: string) {
        await this.prisma.tagsOnTimecodes.delete({ where: { id: parseInt(timecodeTagId) } });
        await this.prisma.$executeRaw(Prisma.sql`
            DELETE FROM timecodes_on_files
            WHERE
                id = ${timecodeId} AND
                (
                    SELECT COUNT(*)
                    FROM tags_on_timecodes
                    WHERE timecode_id = ${timecodeId}
                )
                = 0`);
    }

    public async updateTimecodeStartAndEnd(timecode_id: number, timecode: Timecode): Promise<void> {
        await this.prisma.timecodesOnFiles.update({
            where: {
                id: timecode_id,
            },
            data: {
                start: timecode.start,
                end: timecode.end,
            },
        });
    }

    public async getTimecodesForFile(file: File): Promise<Timecode[]> {
        const rawResults = await this.prisma.timecodesOnFiles.findMany({
            where: {
                fileId: file.fileId,
            },
            include: {
                File: true,
            },
            orderBy: [
                {
                    start: 'asc',
                },
                { end: 'asc' },
            ],
        });
        const timecodes: Timecode[] = rawResults.map(
            (row) => new Timecode(row.id, row.fileId, row.File.path, [], row.start, row.end)
        );
        const timecodeIds = timecodes.map((t) => t.timecodeId);

        const rawResults2 = await this.prisma.tagsOnTimecodes.findMany({
            where: {
                timecodeId: { in: timecodeIds },
            },
            include: {
                Tag: true,
            },
        });
        rawResults2.forEach((row) => {
            const timecode = timecodes.find((t) => t.timecodeId === row.timecodeId);

            if (timecode) {
                timecode.timecodeTags.push(
                    new TimecodeTag(row.timecodeId, row.id, new Tag(row.tagId, row.Tag.name, 0))
                );
            }
        });

        const timecodesWithTags = timecodes.filter((t) => t.timecodeTags.length > 0);
        return timecodesWithTags;
    }

    public async getTimecodes(query: Query): Promise<Timecode[]> {
        const rawResults = await this.prisma.timecodesOnFiles.findMany({
            include: {
                File: true,
            },
            orderBy: {
                File: {
                    path: 'asc',
                },
            },
        });
        const timecodes: Timecode[] = rawResults.map(
            (row) => new Timecode(row.id, row.fileId, row.File.path, [], row.start, row.end)
        );
        const timecodeIds = timecodes.map((t) => t.timecodeId);

        const rawResults2 = await this.prisma.tagsOnTimecodes.findMany({
            where: {
                timecodeId: { in: timecodeIds },
            },
            include: {
                Tag: true,
            },
        });
        rawResults2.forEach((row) => {
            const timecode = timecodes.find((t) => t.timecodeId === row.timecodeId);

            if (timecode) {
                timecode.timecodeTags.push(
                    new TimecodeTag(row.timecodeId, row.id, new Tag(row.tagId, row.Tag.name, 0))
                );
            }
        });

        let timecodesWithTags = timecodes.filter((t) => t.timecodeTags.length > 0);

        if (query.filename) {
            timecodesWithTags = timecodesWithTags.filter((t) =>
                query.filename
                    ? // Currently timecode query only supports single filename.
                      t.path.toLocaleLowerCase().indexOf(query.filename[0]) > -1
                    : -1
            );
        }

        if (query.and && query.and.length > 0) {
            const queryTagIds = query.and.split(',').map((id) => parseInt(id, 10));
            timecodesWithTags = timecodesWithTags.filter((t) =>
                queryTagIds.every((queryTagId) => t.timecodeTags.map((t2) => t2.tag.id).indexOf(queryTagId) >= 0)
            );
        }
        if (query.or && query.or.length > 0) {
            const queryTagIds = query.or.split(',').map((id) => parseInt(id, 10));
            timecodesWithTags = timecodesWithTags.filter((t) =>
                queryTagIds.some((queryTagId) => t.timecodeTags.map((t2) => t2.tag.id).indexOf(queryTagId) >= 0)
            );
        }
        if (query.not && query.not.length > 0) {
            const queryTagIds = query.not.split(',').map((id) => parseInt(id, 10));
            timecodesWithTags = timecodesWithTags.filter((t) =>
                queryTagIds.every((queryTagId) => t.timecodeTags.map((t2) => t2.tag.id).indexOf(queryTagId) < 0)
            );
        }

        return timecodesWithTags;
    }

    public async deleteLinksBetweenTagsAndFiles(inputTags: Tag[], files: File[]): Promise<FileTagLink[]> {
        if (inputTags && inputTags.length === 0) {
            throw new Error('No tags provided for linking');
        }
        if (files && files.length === 0) {
            throw new Error('No files provided for linking');
        }

        const tagIds = inputTags.map((tag) => tag.id);
        const fileIds = files.map((file) => file.fileId);

        const rawResults = await this.prisma.tagsOnFiles.findMany({
            where: {
                tagId: { in: tagIds },
                fileId: { in: fileIds },
            },
        });

        const selectResults: Map<number, Set<number>> = new Map<number, Set<number>>();
        rawResults.forEach((row) => {
            if (!selectResults.has(row.fileId)) {
                selectResults.set(row.fileId, new Set<number>());
            }
            // Map entry is guaranteed to exist as we just checked and/or created it.
            (<Set<number>>selectResults.get(row.fileId)).add(row.tagId);
        });

        const deletes: Prisma.Sql[] = [];
        const results: FileTagLink[] = [];

        for (const inputTag of inputTags) {
            for (const file of files) {
                if (selectResults.has(file.fileId) && (<Set<number>>selectResults.get(file.fileId)).has(inputTag.id)) {
                    winston.verbose(`${file.path} already had ${inputTag.name}`);
                    deletes.push(Prisma.sql`(file_id = ${file.fileId} AND tag_id = ${inputTag.id})`);
                    results.push(new FileTagLink(file, inputTag));
                } else {
                    winston.verbose(`${file.path} did NOT HAVE ${inputTag.name}`);
                }
            }
        }

        if (deletes.length === 0) {
            return [];
        }

        const combinedDeletes = deletes.reduce(
            (query, deletion, currentIndex) =>
                currentIndex === 0 ? Prisma.sql` ${query} ${deletion} ` : Prisma.sql` ${query} OR ${deletion} `,
            Prisma.empty
        );
        const deleteSql = Prisma.sql`DELETE FROM tags_on_files WHERE ${combinedDeletes}`;
        await this.prisma.$executeRaw(deleteSql);
        return results;
    }

    public async deleteLinkBetweenTagAndFile(inputTag: number, inputFile: string): Promise<void> {
        const file = await this.getFile(inputFile);

        await this.prisma.tagsOnFiles.delete({
            where: {
                fileId_tagId: {
                    tagId: inputTag,
                    fileId: file.fileId,
                },
            },
        });
    }

    public async storeTimeForFileScreenshot(file: File, time: number): Promise<void> {
        await this.prisma.screenshotFile.upsert({
            where: {
                id: file.fileId,
            },
            update: {
                time: time,
            },
            create: {
                id: file.fileId,
                time: time,
            },
        });
    }

    public async storeTimeForTimecodeScreenshot(timecode: Timecode, time: number): Promise<void> {
        await this.prisma.screenshotTimecode.upsert({
            where: {
                id: timecode.timecodeId,
            },
            update: {
                time: time,
            },
            create: {
                id: timecode.timecodeId,
                time: time,
            },
        });
    }

    public async storeTimeForTagScreenshot(tag: Tag, file: File, time: number): Promise<void> {
        await this.prisma.screenshotTag.upsert({
            where: { id: tag.id },
            update: {
                fileId: file.fileId,
                time: time,
            },
            create: {
                id: tag.id,
                fileId: file.fileId,
                time: time,
            },
        });
    }
}
