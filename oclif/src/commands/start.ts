import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import path = require('path');

import { compose } from '../laputin/compose';
import { getLibraryPath } from '../laputin/helpers';
import { initializeWinston } from '../laputin/winston';
import chalk = require('chalk');
import express = require('express');
import winston = require('winston');

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

        initializeWinston(flags.verbose);

        const libraryPath = await getLibraryPath(flags.library);

        const configFilePath = path.join(libraryPath, 'laputin.json');
        const configurationExists = await fs.stat(configFilePath);
        if (!configurationExists) {
            throw new Error(
                `Could not find configuration file at ${configFilePath}`
            );
        }
        const configurationJson = await fs.readFile(configFilePath, 'utf8');
        const configuration = JSON.parse(configurationJson);

        const laputin = compose(libraryPath, configuration);

        const app = express();
        laputin.initializeRoutes(app);
        await laputin.loadFiles(flags.performFullCheck);

        try {
            app.listen(configuration.port, () => {
                winston.info(
                    `Laputin in ${chalk.green(libraryPath)} at ${chalk.green(
                        'http://localhost:' + configuration.port
                    )}`
                );
            });
        } catch (error) {
            winston.error('ERROR:', error);
        }
    }
}
