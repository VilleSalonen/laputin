import fs = require('fs');
import { Command, Flags } from '@oclif/core';
import { getLibraryPathByFile } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import { promisify } from 'bluebird';
import { IHasher } from '../laputin/ihasher';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';
import winston = require('winston');
import { Screenshotter } from '../laputin/screenshotter';

export default class SetScreenshot extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        file: Flags.string({ required: true, char: 'f' }),
        screenshot: Flags.string({ required: true, char: 's' }),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(SetScreenshot);

        initializeWinston(flags.verbose);

        if (!fs.existsSync(flags.file) || !fs.statSync(flags.file).isFile()) {
            throw new Error(`File ${flags.file} is not a valid file.`);
        }

        if (
            !fs.existsSync(flags.screenshot) ||
            !fs.statSync(flags.screenshot).isFile()
        ) {
            throw new Error(`File ${flags.screenshot} is not a valid file.`);
        }

        const libraryPath = getLibraryPathByFile(flags.file);
        const library = new Library(libraryPath);

        const hasher: IHasher = new QuickMD5Hasher();

        const fileStats = fs.statSync(flags.file);
        const hash = await hasher.hash(flags.file, <any>fileStats);
        const file = await library.getFile(hash);
        if (!file) {
            throw new Error(`Could not find file with hash ${hash}!`);
        }

        winston.info(`${file.hash}`);

        const screenshotter = new Screenshotter(libraryPath, library);
        screenshotter.setScreenshot(file, flags.screenshot);
    }
}
