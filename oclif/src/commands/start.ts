import { Command, Flags } from '@oclif/core';
import express = require('express');
import fs = require('fs');
import path = require('path');
import { compose } from '../laputin/compose';
import { getLibraryPath } from '../laputin/helpers';
import { LaputinConfiguration } from '../laputin/laputinconfiguration';

export default class Start extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        // flag with a value (-n, --name=VALUE)
        name: Flags.string({ char: 'n', description: 'name to print' }),
        // flag with no value (-f, --force)
        force: Flags.boolean({ char: 'f' }),

        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        port: Flags.string({ description: 'API port', default: '3000' }),
        performFullCheck: Flags.boolean({ default: false }),
        skipBrowserOpen: Flags.boolean({ default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(Start);

        const libraryPath = getLibraryPath(flags.library);

        const configFilePath = path.join(flags.library, '.laputin.json');
        const configuration: LaputinConfiguration = fs.existsSync(
            configFilePath
        )
            ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
            : new LaputinConfiguration(3200, 'quick', undefined, []);

        const laputin = compose(libraryPath, configuration);

        var app = express();
        app.use(express.static('C:\\Github\\laputin\\oclif\\client\\dist'));

        // laputin.initializeRoutes(app);
        // await laputin.loadFiles(flags.performFullCheck);

        // laputin.startMonitoring();

        this.log(`Library path: ${libraryPath}`);

        if (!flags.skipBrowserOpen) {
            // open(`http://localhost:${configuration.port}`);
        }

        try {
            app.listen(configuration.port, () => {
                console.log(
                    `Laputin started at http://localhost:${configuration.port}`
                );
            });
        } catch (error) {
            this.log('ERROR:', error);
        }
    }
}
