import commandLineArgs = require('command-line-args');
import fs = require('fs');
import path = require('path');

import { Command } from './command';
import { getLibraryPath } from '..';
import { Library } from '../library';
import { LaputinConfiguration } from '../laputinconfiguration';
import { ProxyGenerator } from '../proxygenerator';

export class CreateProxiesCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', defaultOption: true }
    ];

    public async execute(options: any): Promise<void> {
        const libraryPath = getLibraryPath(options.libraryPath);

        const configFilePath = path.join(options.libraryPath, '.laputin.json');
        const configuration: LaputinConfiguration = fs.existsSync(
            configFilePath
        )
            ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
            : new LaputinConfiguration(3200, 'quick', null, []);

        const library = new Library(libraryPath);
        const proxyGenerator = new ProxyGenerator(library, configuration);
        await proxyGenerator.generateMissingProxies();
    }
}
