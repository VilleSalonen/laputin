import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import * as fsLegacy from 'fs';
import winston = require('winston');

import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import { IHasher } from '../laputin/ihasher';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';
import { Screenshotter } from '../laputin/screenshotter';

export default class SetScreenshot extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        file: Flags.string({ required: true, char: 'f' }),
        screenshot: Flags.string({ required: true, char: 's' }),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { args, flags } = await this.parse(SetScreenshot);

        initializeWinston(flags.verbose);

        const fileStat = await fs.stat(flags.file);
        if (!fileStat || !fileStat.isFile()) {
            throw new Error(`File ${flags.file} is not a valid file.`);
        }

        if (!fsLegacy.existsSync(flags.screenshot) || !(await fs.stat(flags.screenshot)).isFile()) {
            throw new Error(`File ${flags.screenshot} is not a valid file.`);
        }

        const libraryPath = await getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const hasher: IHasher = new QuickMD5Hasher();

        const hash = await hasher.hash(flags.file, fileStat);
        const file = await library.getFile(hash);
        if (!file) {
            throw new Error(`Could not find file with hash ${hash}!`);
        }

        winston.info(`${file.hash}`);

        const screenshotter = new Screenshotter(libraryPath, library);
        screenshotter.setScreenshot(file, flags.screenshot);
    }
}
