import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import winston = require('winston');

import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';
import { IHasher } from '../laputin/ihasher';

export default class MetadataCommand extends Command {
    static description = 'Set file metadata';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        file: Flags.string({ required: true }),
        metadataFileName: Flags.string({ required: true }),
        verbose: Flags.boolean(),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { args, flags } = await this.parse(MetadataCommand);

        initializeWinston(flags.verbose);

        const fileStat = await fs.stat(flags.file);
        if (!fileStat?.isFile()) {
            throw new Error(`${flags.file} is not a valid file.`);
        }

        const metadataFileStat = await fs.stat(flags.metadataFileName);
        if (!metadataFileStat?.isFile) {
            throw new Error(`${flags.metadataFileName} is not a valid file.`);
        }

        const metadata = (await fs.readFile(flags.metadataFileName, 'utf8')).trim();
        const metadataObject = JSON.parse(metadata);

        const libraryPath = await getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const hasher: IHasher = new QuickMD5Hasher();

        const hash = await hasher.hash(flags.file, fileStat);
        const file = await library.getFileByHash(hash);
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
