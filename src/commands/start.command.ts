import winston = require('winston');
import commandLineArgs = require('command-line-args');
import fs = require('fs');
import path = require('path');
import open = require('open');

import { Command } from './command';
import { getLibraryPath } from '..';
import { LaputinConfiguration } from '../laputinconfiguration';
import { compose } from '../compose';

export class StartCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', defaultOption: true },
        { name: 'performFullCheck', type: Boolean, multiple: false },
        {
            name: 'skipBrowserOpen',
            type: Boolean,
            multiple: false
        }
    ];

    public async execute(options: any): Promise<void> {
        const libraryPath = getLibraryPath(options.libraryPath);

        const configFilePath = path.join(options.libraryPath, '.laputin.json');
        const configuration: LaputinConfiguration = fs.existsSync(
            configFilePath
        )
            ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
            : new LaputinConfiguration(3200, 'quick', null, []);

        const laputin = compose(libraryPath, configuration);

        laputin.initializeRoutes();
        const timer = winston.startTimer();
        await laputin.loadFiles(options.performFullCheck);
        timer.done('Hashing');

        laputin.startMonitoring();

        winston.info(`Library path: ${libraryPath}`);
        await laputin.startListening();
        winston.info(
            `Laputin started at http://localhost:${configuration.port}`
        );
        if (!options.skipBrowserOpen) {
            await open(`http://localhost:${configuration.port}`);
        }
    }
}
