import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import * as fsLegacy from 'fs';
import path = require('path');

import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import { ProxyGenerator } from '../laputin/proxygenerator';

export default class CreateProxiesCommand extends Command {
    static description = 'Creates lower quality H.264 proxy files for videos using incompatible codecs such as H.265.';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { args, flags } = await this.parse(CreateProxiesCommand);

        initializeWinston(flags.verbose);

        const libraryPath = await getLibraryPath(flags.library);

        const configFilePath = path.join(libraryPath, 'laputin.json');
        const configurationExists = fsLegacy.existsSync(configFilePath);
        if (!configurationExists) {
            throw new Error(`Could not find configuration file at ${configFilePath}`);
        }
        const configurationJson = await fs.readFile(configFilePath, 'utf8');
        const configuration = JSON.parse(configurationJson);

        const library = new Library(libraryPath);
        const proxyGenerator = new ProxyGenerator(library, configuration);
        await proxyGenerator.generateMissingProxies();
    }
}
