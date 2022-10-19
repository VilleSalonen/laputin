import { Command, Flags } from '@oclif/core';
import child_process = require('child_process');
import fs = require('fs/promises');
import path = require('path');
import winston = require('winston');

import { initializeWinston } from '../../laputin/winston';
import { getLibraryPath } from '../../laputin/helpers';

export default class RefreshBackupFilesCommand extends Command {
    static description = 'Refresh list of backed up files';

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
        json: Flags.boolean(),
        pretty: Flags.boolean(),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(RefreshBackupFilesCommand);

        initializeWinston(flags.verbose);

        const libraryPath = await getLibraryPath(flags.library);
        const rcloneJsonPath = path.join(libraryPath, 'rclone.json');

        const rcloneJson = await fs.readFile(rcloneJsonPath, 'utf8');
        const rcloneList = JSON.parse(rcloneJson);

        const child = child_process.spawn('rclone', [
            'lsjson',
            `${flags.remote}:`,
            '--fast-list',
            '-M',
            '--no-mimetype',
            '--no-modtime',
            '--original',
        ]);

        let data = '';
        for await (const chunk of child.stdout) {
            data += chunk;
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

        await fs.writeFile(rcloneJsonPath, data);

        var currentList = JSON.parse(data);

        const previousSize = rcloneList.reduce(
            (sum: number, f: any) => sum + f.Size,
            0
        );
        const currentSize = currentList.reduce(
            (sum: number, f: any) => sum + f.Size,
            0
        );

        winston.info(
            `${
                currentList.length - rcloneList.length
            } new files (${this.humanFileSize(
                currentSize - previousSize
            )}).\r\nTotal: ${currentList.length} files (${this.humanFileSize(
                currentSize
            )})`
        );
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
