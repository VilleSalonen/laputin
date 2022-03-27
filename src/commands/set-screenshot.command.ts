import fs = require('fs');
import winston = require('winston');
import { promisify } from 'util';
const stat = promisify(fs.stat);
import commandLineArgs = require('command-line-args');

import { Command } from './command';
import { getLibraryPath } from '..';
import { Library } from '../library';
import path = require('path');
import { LaputinConfiguration } from '../laputinconfiguration';
import { IHasher } from '../ihasher';
import { QuickMD5Hasher } from '../quickmd5hasher';
import { Screenshotter } from '../screenshotter';

export class SetScreenshotCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', type: String },
        { name: 'fileName', type: String },
        { name: 'screenshotPath', type: String }
    ];

    public async execute(options: any): Promise<void> {
        if (
            !fs.existsSync(options.fileName) ||
            !fs.statSync(options.fileName).isFile()
        ) {
            throw new Error(
                `File ${options.fileName} is not a valid file.`
            );
        }

        if (
            !fs.existsSync(options.screenshotPath) ||
            !fs.statSync(options.screenshotPath).isFile()
        ) {
            throw new Error(
                `File ${options.screenshotPath} is not a valid file.`
            );
        }

        const libraryPath = getLibraryPath(options.libraryPath);
        const library = new Library(libraryPath);

        const configFilePath = path.join(options.libraryPath, '.laputin.json');
        const configuration: LaputinConfiguration = fs.existsSync(
            configFilePath
        )
            ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
            : new LaputinConfiguration(3200, 'quick', null, []);

        const hasher: IHasher = new QuickMD5Hasher();

        const fileStats = await stat(options.fileName);
        const hash = await hasher.hash(options.fileName, fileStats);
        const file = await library.getFile(hash);
        if (!file) {
            throw new Error(`Could not find file with hash ${hash}!`);
        }

        winston.info(`${file.hash}`);

        const screenshotter = new Screenshotter(libraryPath, library);
        screenshotter.setScreenshot(file, options.screenshotPath);

        return;
    }
}
