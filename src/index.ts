import commandLineArgs = require('command-line-args');
import commandLineUsage = require('command-line-usage');
import winston = require('winston');

import { HashCommand } from './commands/hash.command';
import { Command } from './commands/command';
import { InitializeCommand } from './commands/initialize.command';
import { QueryCommand } from './commands/query.command';
import { StartCommand } from './commands/start.command';
import { DetectScenesCommand } from './commands/detect-scenes.command';
import { CreateProxiesCommand } from './commands/create-proxies.command';
import { ExportTimecodesCommand } from './commands/export-timecodes.command';
import { TagCommand } from './commands/tag.command';

export function getLibraryPath(givenLibraryPath?: string): string {
    const libraryPath = givenLibraryPath || process.cwd();

    // For some reason " is added only to the end of the path if path contains spaces.
    return libraryPath.replace(/\"/g, '');
}

(async function () {
    const sections = [
        {
            header: 'Laputin',
            content: 'Organize your local files with tags.',
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'library',
                    typeLabel: '{underline path}',
                    description: 'Path to your file library.',
                },
                {
                    name: 'help',
                    description: 'Print this usage guide.',
                },
            ],
        },
    ];
    const usage = commandLineUsage(sections);

    const globalDefinitions = [
        { name: 'verbose', type: Boolean, multiple: false },
    ];
    const globalOptions = commandLineArgs(globalDefinitions, { partial: true });

    if (globalOptions.verbose) {
        winston.level = 'verbose';
    }

    const argvAfterGlobalOptions = globalOptions._unknown || [];

    const mainDefinitions = [
        { name: 'command', defaultOption: true },
        { name: 'help', type: Boolean, multiple: false },
    ];
    const mainOptions = commandLineArgs(mainDefinitions, {
        argv: argvAfterGlobalOptions,
        stopAtFirstUnknown: true,
    });
    const argvAfterMainOptions = mainOptions._unknown || [];

    const commands: { [key: string]: Command } = {
        initialize: new InitializeCommand(),
        start: new StartCommand(),
        hash: new HashCommand(),
        query: new QueryCommand(),
        tag: new TagCommand(),
        'detect-scenes': new DetectScenesCommand(),
        'create-proxies': new CreateProxiesCommand(),
        'export-timecodes': new ExportTimecodesCommand(),
    };

    const command = commands[mainOptions.command];
    if (command) {
        try {
            const commandOptions = commandLineArgs(command.optionDefinitions, {
                argv: argvAfterMainOptions,
            });
            await command.execute(commandOptions);
        } catch (err) {
            winston.error(err);
            process.exit(-1);
        }
    } else {
        winston.error(`Unknown command "${mainOptions.command}".`);
        console.log(usage);
        process.exit(0);
    }
})();
