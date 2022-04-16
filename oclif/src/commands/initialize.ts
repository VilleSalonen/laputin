import { Command, Flags } from '@oclif/core';
import winston from 'winston';
import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';

export default class Initialize extends Command {
    static description = 'describe the command here';

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
        const { args, flags } = await this.parse(Initialize);

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);
        await Library.initialize(libraryPath);

        winston.info(
            `${flags.library} has been initialized as Laputin library. You can now start Laputin without --initialize.`
        );
    }
}
