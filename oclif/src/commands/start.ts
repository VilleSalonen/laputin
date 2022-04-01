import { Command, Flags } from '@oclif/core';
import express = require('express');
import fs = require('fs');
import path = require('path');
import { format } from 'winston';
import winston = require('winston');
import { compose } from '../laputin/compose';
import { getLibraryPath } from '../laputin/helpers';
import { LaputinConfiguration } from '../laputin/laputinconfiguration';

export default class Start extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        performFullCheck: Flags.boolean({ default: false }),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(Start);

        winston.add(
            new winston.transports.Console({
                format: format.combine(format.colorize(), format.simple()),
            })
        );

        if (flags.verbose) {
            winston.level = 'verbose';
        }

        const libraryPath = getLibraryPath(flags.library);

        const configFilePath = path.join(flags.library, '.laputin.json');
        const configuration: LaputinConfiguration = fs.existsSync(
            configFilePath
        )
            ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
            : new LaputinConfiguration(3200, 'quick', undefined, []);

        const laputin = compose(libraryPath, configuration);

        var app = express();
        laputin.initializeRoutes(app);
        await laputin.loadFiles(flags.performFullCheck);

        laputin.startMonitoring();

        try {
            app.listen(configuration.port, () => {
                winston.info(
                    `Laputin in ${libraryPath} at http://localhost:${configuration.port}`
                );
            });
        } catch (error) {
            winston.error('ERROR:', error);
        }
    }
}
