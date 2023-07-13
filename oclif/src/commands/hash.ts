import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import * as fsLegacy from 'fs';
import winston = require('winston');

import { initializeWinston } from '../laputin/winston';
import { IHasher } from '../laputin/ihasher';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';
import { OsHashHasher } from '../laputin/oshashhasher';

export default class HashCommand extends Command {
    static description = 'Hashes given file';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        file: Flags.string({ required: true }),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { args, flags } = await this.parse(HashCommand);

        initializeWinston(flags.verbose);

        const quickMd5Hasher: IHasher = new QuickMD5Hasher();
        const osHashHasher: IHasher = new OsHashHasher();

        if (!fsLegacy.existsSync(flags.file)) {
            winston.error('File not found.');
            process.exit(-1);
        }

        const fileStat = await fs.stat(flags.file);
        const quickMd5Hash = await quickMd5Hasher.hash(flags.file, fileStat);
        const osHashHash = await osHashHasher.hash(flags.file, fileStat);
        winston.info(`Laputin Hash: ${quickMd5Hash}`);
        winston.info(`OSHash Hash: ${osHashHash}`);
    }
}
