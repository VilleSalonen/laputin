import fs = require('fs');
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
import winston = require('winston');

export class MetadataCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', type: String },
        { name: 'fileName', type: String },
        { name: 'metadataFileName', type: String },
    ];

    public async execute(options: any): Promise<void> {
        if (
            !fs.existsSync(options.fileName) ||
            !fs.statSync(options.fileName).isFile()
        ) {
            throw new Error(
                `${options.fileName} is not a valid file.`
            );
        }

        if (
            !fs.existsSync(options.metadataFileName) ||
            !fs.statSync(options.metadataFileName).isFile()
        ) {
            throw new Error(
                `${options.metadataFileName} is not a valid file.`
            );
        }

        const metadata = fs.readFileSync(options.metadataFileName, 'utf8').trim();
        const metadataObject = JSON.parse(metadata);

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

        await library.updateMetadata(file, {
            ...file.metadata,
            ...metadataObject,
        });

        winston.log('info', `Target file: ${options.fileName}`);
        winston.log('info', `Metadata: ${metadata}`);
    }
}
