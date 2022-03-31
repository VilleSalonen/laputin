import { Command, Flags } from '@oclif/core';
import express = require('express');

export default class Start extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        // flag with a value (-n, --name=VALUE)
        name: Flags.string({ char: 'n', description: 'name to print' }),
        // flag with no value (-f, --force)
        force: Flags.boolean({ char: 'f' }),

        port: Flags.string({ description: 'API port', default: '3000' }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(Start);
        const port = flags.port;

        try {
            var app = express();
            app.use(express.json());

            app.get('/', (req, res) => res.send('moi').status(200));

            app.get('/favicon.ico', (req, res) => {});

            app.get('/service-worker.js', (req, res) => {});

            // app.get('/*', async (req, res) => {
            //     // Generate class path from route
            //     var classPath = req.path.replace(/\/$/gm, '').slice(1);
            //
            //     // Import command from class path
            //     const commandClass = require(`./${classPath}.js`);
            //
            //     // Create command parameters
            //     var parameters = ['--api'];
            //     for (var key in req.query) {
            //         parameters.push('--' + key);
            //         parameters.push(req.query[key]);
            //     }
            //
            //     // Execute command
            //     res.status(200).json([await commandClass.run(parameters)]);
            // });

            app.listen(port, () => {
                console.log(`API server running at http://localhost:${port}`);
            });
        } catch (error) {
            // error handling here
        }

        const name = flags.name ?? 'world';
        this.log(
            `hello ${name} from C:\\Github\\laputin\\oclif\\src\\commands\\start.ts`
        );
        if (args.file && flags.force) {
            this.log(`you input --force and --file: ${args.file}`);
        }
    }
}
