import { Command, Flags } from '@oclif/core';
import child_process = require('node:child_process');
import fs = require('fs/promises');
import path = require('path');

import { File as LaputinFile } from '../../laputin/file';
import { getLibraryPath } from '../../laputin/helpers';
import { Library } from '../../laputin/library';
import { Query } from '../../laputin/query.model';
import { initializeWinston } from '../../laputin/winston';
import { Tag } from '../../laputin/tag';

export default class BackupFilesCommand extends Command {
    static description = 'Back up files';

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
        const { args, flags } = await this.parse(BackupFilesCommand);

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
            false
        );

        const rcloneJsonPath = path.join(libraryPath, 'rclone.json');
        const exists = await fs.stat(rcloneJsonPath);

        if (!exists) {
            throw new Error(
                `Could not find rclone backup file with name ${rcloneJsonPath}.`
            );
        }

        const rcloneJson = await fs.readFile(rcloneJsonPath, 'utf8');
        const rcloneList = JSON.parse(rcloneJson);
        const rcloneMap = new Map<string, any>();
        rcloneList.forEach((rcloneFile: any) =>
            rcloneMap.set(rcloneFile.Path, rcloneFile)
        );

        const allFiles = await library.getFiles(query);

        const activeFilesMap = new Map<string, LaputinFile>();
        allFiles.forEach((file) =>
            activeFilesMap.set(file.hash, <LaputinFile>file)
        );

        const filesToCopy = [];
        for (const file of allFiles) {
            if (
                !rcloneMap.has(file.hash) ||
                rcloneMap.get(file.hash).Size !== file.size
            ) {
                filesToCopy.push(file);
            }
        }

        let totalSize = filesToCopy.reduce((sum, file) => sum + file.size, 0);
        console.log(
            `Backing up ${
                filesToCopy.length
            } files, total size: ${this.humanFileSize(totalSize)}`
        );

        for (const file of filesToCopy) {
            console.log(`${file.path} ${file.hash}`);

            const child = child_process.spawn('rclone.exe', [
                'copyto',
                '--progress',
                file.path,
                `${flags.remote}:${file.hash}`,
            ]);

            for await (const chunk of child.stdout) {
                const regex =
                    /(\d+\.\d+) (kiB|MiB|GiB|TiB) \/ (\d+\.\d+) (kiB|MiB|GiB|TiB), (\d+%), (\d+\.\d+) (KiB|MiB|GiB|TiB)\/s, ETA (.*)/gm;
                const array = [...chunk.toString().matchAll(regex)];
                if (array.length !== 0) {
                    process.stdout.write(`${array[array.length - 1][0]}\r`);
                }
            }
            let error = '';
            for await (const chunk of child.stderr) {
                console.error('stderr chunk: ' + chunk);
                error += chunk;
            }
            const exitCode = await new Promise((resolve, reject) => {
                child.on('close', resolve);
            });

            if (exitCode) {
                throw new Error(`subprocess error exit ${exitCode}, ${error}`);
            }
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
