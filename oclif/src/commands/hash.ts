import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import winston = require('winston');

import { initializeWinston } from '../laputin/winston';
import { IHasher } from '../laputin/ihasher';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';

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

        const hasher: IHasher = new QuickMD5Hasher();

        const fileStat = await fs.stat(flags.file);
        if (!fileStat) {
            winston.error('File not found.');
            process.exit(-1);
        }

        const hash = await hasher.hash(flags.file, fileStat);
        console.log(hash);
    }
}
