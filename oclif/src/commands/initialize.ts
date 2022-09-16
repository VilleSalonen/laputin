import { Command, Flags } from '@oclif/core';
import winston = require('winston');
import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';

export default class InitializeCommand extends Command {
    static description = 'Initializes new Laputin library';

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
        const { args, flags } = await this.parse(InitializeCommand);

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);
        await Library.initialize(libraryPath);

        winston.info(
            `${libraryPath} has been initialized as Laputin library. You can now start Laputin without --initialize.`
        );
    }
}
