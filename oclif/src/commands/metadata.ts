import { Command, Flags } from '@oclif/core';
import winston = require('winston');
import { getLibraryPath, getLibraryPathByFile } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import * as fs from 'fs';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';
import { IHasher } from '../laputin/ihasher';

export default class MetadataCommand extends Command {
    static description = 'Set file metadata';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        file: Flags.string({ required: true }),
        metadataFileName: Flags.string({ required: true }),
        verbose: Flags.boolean(),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(MetadataCommand);

        initializeWinston(flags.verbose);

        if (!fs.existsSync(flags.file) || !fs.statSync(flags.file).isFile()) {
            throw new Error(`${flags.file} is not a valid file.`);
        }

        if (
            !fs.existsSync(flags.metadataFileName) ||
            !fs.statSync(flags.metadataFileName).isFile()
        ) {
            throw new Error(`${flags.metadataFileName} is not a valid file.`);
        }

        const metadata = fs.readFileSync(flags.metadataFileName, 'utf8').trim();
        const metadataObject = JSON.parse(metadata);

        const libraryPath = getLibraryPathByFile(flags.file);
        const library = new Library(libraryPath);

        const hasher: IHasher = new QuickMD5Hasher();

        const fileStats = fs.statSync(flags.file);
        const hash = await hasher.hash(flags.file, fileStats);
        const file = await library.getFile(hash);
        if (!file) {
            throw new Error(`Could not find file with hash ${hash}!`);
        }

        await library.updateMetadata(file, {
            ...file.metadata,
            ...metadataObject,
        });

        winston.log('info', `Target file: ${flags.file}`);
        winston.log('info', `Metadata: ${metadata}`);
    }
}
