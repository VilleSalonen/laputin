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
import { XxhashHasher } from '../xxhashhasher';

export class MetadataCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', type: String },
        { name: 'fileName', type: String },
        { name: 'metadata', type: String },
    ];

    public async execute(options: any): Promise<void> {
        if (
            !fs.existsSync(options.fileName) ||
            !fs.statSync(options.fileName).isFile()
        ) {
            throw new Error(
                `Directory ${options.fileName} is not a valid file.`
            );
        }

        const metadataObject = JSON.parse(options.metadata);

        const libraryPath = getLibraryPath(options.libraryPath);
        const library = new Library(libraryPath);

        const configFilePath = path.join(options.libraryPath, '.laputin.json');
        const configuration: LaputinConfiguration = fs.existsSync(
            configFilePath
        )
            ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
            : new LaputinConfiguration(3200, 'quick', null, []);

        let hasher: IHasher = new QuickMD5Hasher();
        if (
            configuration.identification &&
            configuration.identification === 'accurate'
        ) {
            hasher = new XxhashHasher();
        }

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
    }
}
