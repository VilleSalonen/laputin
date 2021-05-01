import fs = require('fs');
import { promisify } from 'util';
const stat = promisify(fs.stat);
import winston = require('winston');
import commandLineArgs = require('command-line-args');

import { Command } from './command';
import { IHasher } from '../ihasher';
import { QuickMD5Hasher } from '../quickmd5hasher';

export class HashCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'filePath', defaultOption: true },
        { name: 'hasher', type: String, multiple: false }
    ];

    public async execute(hashOptions: any): Promise<void> {
        const hasher: IHasher = new QuickMD5Hasher();

        if (!fs.existsSync(hashOptions.filePath)) {
            winston.error('File not found.');
            process.exit(-1);
        }

        const fileStats = await stat(hashOptions.filePath);
        const hash = await hasher.hash(hashOptions.filePath, fileStats);
        console.log(hash);
    }
}
