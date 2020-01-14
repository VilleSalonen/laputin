import winston = require('winston');
import commandLineArgs = require('command-line-args');

import { Command } from './command';
import { getLibraryPath } from '..';
import { Library } from '../library';

export class InitializeCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', defaultOption: true }
    ];

    public async execute(options: any): Promise<void> {
        const libraryPath = getLibraryPath(options.libraryPath);
        await Library.initialize(libraryPath);

        winston.info(
            `${options.libraryPath} has been initialized as Laputin library. You can now start Laputin without --initialize.`
        );
    }
}
