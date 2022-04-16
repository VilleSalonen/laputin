import { Command, Flags } from '@oclif/core';
import { initializeWinston } from '../laputin/winston';
import fs = require('fs');
import { IHasher } from '../laputin/ihasher';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';
import winston = require('winston');

export default class HashCommand extends Command {
    static description = 'Hashes given file';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        file: Flags.string({ required: true }),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(HashCommand);

        initializeWinston(flags.verbose);

        const hasher: IHasher = new QuickMD5Hasher();

        if (!fs.existsSync(flags.file)) {
            winston.error('File not found.');
            process.exit(-1);
        }

        const fileStats = fs.statSync(flags.file);
        const hash = await hasher.hash(flags.file, fileStats);
        console.log(hash);
    }
}
