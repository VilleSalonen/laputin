const rclone = require('rclone.js');

import { Command, Flags } from '@oclif/core';
import { File as LaputinFile } from '../../laputin/file';
import { getLibraryPath } from '../../laputin/helpers';
import { Library } from '../../laputin/library';
import { Query } from '../../laputin/query.model';
import { initializeWinston } from '../../laputin/winston';
import * as path from 'path';
import * as fs from 'fs/promises';

export default class BackupFilesCommand extends Command {
    static description = 'Back up files';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        json: Flags.boolean(),
        pretty: Flags.boolean(),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(BackupFilesCommand);

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const rcloneJsonPath = path.join(flags.library, 'rclone.json');
        const exists = await fs.stat(rcloneJsonPath);

        if (!exists) {
            throw new Error(
                `Could not find rclone backup file with name ${rcloneJsonPath}.`
            );
        }

        const rcloneJson = await fs.readFile(rcloneJsonPath, 'utf8');
        const rcloneList = JSON.parse(rcloneJson);

        const allFiles = await library.getFiles(new Query());

        const activeFilesMap = new Map<string, LaputinFile>();
        allFiles.forEach((file) =>
            activeFilesMap.set(file.hash, <LaputinFile>file)
        );

        for (const rcloneFile of rcloneList) {
            if (!activeFilesMap.has(rcloneFile.Path)) {
                const unavailableFilesWithHash = await library.getFiles(
                    new Query(
                        undefined,
                        undefined,
                        undefined,
                        [rcloneFile.Path],
                        undefined,
                        undefined,
                        undefined,
                        true
                    )
                );

                if (unavailableFilesWithHash.length === 0) {
                    console.log(`unknown file with hash: ${rcloneFile.Path}`);
                } else if (unavailableFilesWithHash.length === 1) {
                    console.log(
                        `unavailable file ${unavailableFilesWithHash[0].path} is backed up`
                    );
                }
            }
        }
    }
}
