import { Command, Flags } from '@oclif/core';
import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import * as fs from 'fs/promises';
import * as fsLegacy from 'fs';
import * as path from 'path';
import { LaputinConfiguration } from '../laputin/laputinconfiguration';
import { ProxyGenerator } from '../laputin/proxygenerator';

export default class CreateProxiesCommand extends Command {
    static description =
        'Creates lower quality H.264 proxy files for videos using incompatible codecs such as H.265.';

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
        const { args, flags } = await this.parse(CreateProxiesCommand);

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);

        const configFilePath = path.join(flags.library, '.laputin.json');
        const configurationExists = await fs.stat(configFilePath);
        if (!configurationExists) {
            throw new Error(
                `Could not find configuration file at ${configFilePath}`
            );
        }
        const configurationJson = await fs.readFile(configFilePath, 'utf8');
        const configuration = JSON.parse(configurationJson);

        const library = new Library(libraryPath);
        const proxyGenerator = new ProxyGenerator(library, configuration);
        await proxyGenerator.generateMissingProxies();
    }
}
