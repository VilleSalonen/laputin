import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import winston = require('winston');

import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';
import { IHasher } from '../laputin/ihasher';
import { File } from '../laputin/file';

export default class MetadataCommand extends Command {
    static description = 'Set file metadata';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        path: Flags.string(),
        hash: Flags.string(),
        metadata: Flags.string(),
        metadataFileName: Flags.string(),
        verbose: Flags.boolean(),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { args, flags } = await this.parse(MetadataCommand);

        initializeWinston(flags.verbose);

        let metadataObject: any;
        if (flags.metadataFileName) {
            const metadata = (await fs.readFile(flags.metadataFileName, 'utf8')).trim();
            metadataObject = JSON.parse(metadata);
        } else if (flags.metadata) {
            metadataObject = JSON.parse(flags.metadata);
        }

        const libraryPath = await getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const hasher: IHasher = new QuickMD5Hasher();

        let file: File;
        if (flags.path) {
            const fileStat = await fs.stat(flags.path);
            if (!fileStat?.isFile()) {
                throw new Error(`${flags.file} is not a valid file.`);
            }

            const hash = await hasher.hash(flags.path, fileStat);
            const fileCandidate = await library.getFileByHash(hash);
            if (!fileCandidate) {
                throw new Error(`Could not find file with hash ${hash}!`);
            }

            file = fileCandidate;
        } else if (flags.hash) {
            const fileCandidate = await library.getFileByHash(flags.hash);
            if (!fileCandidate) {
                throw new Error(`Could not find file with hash ${flags.hash}!`);
            }

            file = fileCandidate;
        } else {
            throw new Error('You must pass either --path or --hash!');
        }

        await library.updateMetadata(file, {
            ...file.metadata,
            ...metadataObject,
        });

        winston.log('info', `Target file: ${file.path}`);
        winston.log('info', `Metadata: ${JSON.stringify(metadataObject)}`);
    }
}
