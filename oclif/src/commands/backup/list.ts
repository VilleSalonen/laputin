import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import * as fsLegacy from 'fs';
import path = require('path');

import { getLibraryPath } from '../../laputin/helpers';
import { Library } from '../../laputin/library';
import { Query } from '../../laputin/query.model';
import { initializeWinston } from '../../laputin/winston';
import { Tag } from '../../laputin/tag';

export default class ListBackupFilesCommand extends Command {
    static description = 'List backed up files';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        remote: Flags.string({
            char: 'r',
            description: 'rclone remote',
            required: true,
        }),
        path: Flags.string({ char: 'p' }),
        hash: Flags.string(),
        tag: Flags.string({ multiple: true }),
        and: Flags.string({ multiple: true }),
        or: Flags.string({ multiple: true }),
        not: Flags.string({ multiple: true }),
        tagged: Flags.boolean({ exclusive: ['untagged'] }),
        untagged: Flags.boolean({ exclusive: ['tagged'] }),
        json: Flags.boolean(),
        pretty: Flags.boolean(),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [];

    public async run(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { args, flags } = await this.parse(ListBackupFilesCommand);

        initializeWinston(flags.verbose);

        const libraryPath = await getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const allTags = await library.getAllTags();

        const andTags: Tag[] = [];
        const andTagNames: string[] = [
            ...(flags.tag || []),
            ...(flags.and || []),
        ];
        if (andTagNames) {
            andTagNames.forEach((tagName: string) => {
                const foundTag = allTags.find(
                    (tag) =>
                        tag.name.toLocaleUpperCase() ===
                        tagName.toLocaleUpperCase()
                );
                if (!foundTag) {
                    throw new Error(`Could not find tag with name ${tagName}.`);
                } else {
                    andTags.push(foundTag);
                }
            });
        }

        const orTags: Tag[] = [];
        if (flags.or) {
            flags.or.forEach((tagName: string) => {
                const foundTag = allTags.find(
                    (tag) =>
                        tag.name.toLocaleUpperCase() ===
                        tagName.toLocaleUpperCase()
                );
                if (!foundTag) {
                    throw new Error(`Could not find tag with name ${tagName}.`);
                } else {
                    orTags.push(foundTag);
                }
            });
        }

        const notTags: Tag[] = [];
        if (flags.not) {
            flags.not.forEach((tagName: string) => {
                const foundTag = allTags.find(
                    (tag) =>
                        tag.name.toLocaleUpperCase() ===
                        tagName.toLocaleUpperCase()
                );
                if (!foundTag) {
                    throw new Error(`Could not find tag with name ${tagName}.`);
                } else {
                    notTags.push(foundTag);
                }
            });
        }

        let status = '';
        if (flags.tagged) {
            status = 'tagged';
        } else if (flags.untagged) {
            status = 'untagged';
        }

        const query = new Query(
            flags.path,
            [],
            status,
            flags.hash ? [flags.hash] : [],
            andTags.map((tag) => tag.id).join(','),
            orTags.map((tag) => tag.id).join(','),
            notTags.map((tag) => tag.id).join(','),
            true
        );

        const rcloneJsonPath = path.join(libraryPath, 'rclone.json');
        if (!fsLegacy.existsSync(rcloneJsonPath)) {
            throw new Error(`Could not find rclone backup file with name ${rcloneJsonPath}.`);
        }

        const rcloneJson = await fs.readFile(rcloneJsonPath, 'utf8');
        const rcloneList = JSON.parse(rcloneJson);
        const rcloneMap = new Map<string, any>();
        rcloneList.forEach((rcloneFile: any) =>
            rcloneMap.set(rcloneFile.Path, rcloneFile)
        );

        const allFiles = await library.getFiles(query);

        const backedUpFiles = [];
        for (const file of allFiles) {
            if (file.metadata?.hashes?.xxhash && rcloneMap.has(file.metadata.hashes.xxhash)) {
                backedUpFiles.push(file);
            }
        }

        const totalSize = backedUpFiles.reduce((sum, file) => sum + file.size, 0);
        console.log(
            `Backed up ${
                backedUpFiles.length
            } files, total size: ${this.humanFileSize(totalSize)}`
        );

        console.log(`Inactive backed up files:`);
        const inactiveFiles = backedUpFiles.filter(file => !file.active);

        for (const file of inactiveFiles) {
            console.log(`${flags.remote}:${file.metadata.hashes.xxhash} ${file.path}`);
        }

        console.log();
        console.log(`Active backed up files:`);
        const activeFiles = backedUpFiles.filter(file => file.active);

        for (const file of activeFiles) {
            console.log(`${flags.remote}:${file.metadata.hashes.xxhash} ${file.path}`);
        }
    }

    private humanFileSize(bytes: number): string {
        const threshold = 1000;
        if (Math.abs(bytes) < threshold) {
            return bytes + ' B';
        }
        const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let unit = -1;
        do {
            bytes = bytes / threshold;
            ++unit;
        } while (Math.abs(bytes) >= threshold && unit < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[unit];
    }
}
