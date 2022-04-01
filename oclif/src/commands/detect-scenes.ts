import { Command, Flags } from '@oclif/core';
import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import fs = require('fs');
import path = require('path');
import { LaputinConfiguration } from '../laputin/laputinconfiguration';
import { SceneDetector } from '../laputin/scenedetector';

export default class DetectScenes extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        file: Flags.string(),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(DetectScenes);

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);

        const configFilePath = path.join(flags.library, '.laputin.json');
        const configuration: LaputinConfiguration = fs.existsSync(
            configFilePath
        )
            ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
            : new LaputinConfiguration(3200, 'quick', undefined, []);

        const library = new Library(libraryPath);
        const sceneDetector = new SceneDetector(flags.library, library);
        await sceneDetector.detectMissingScenes(flags.file || '');
    }
}
