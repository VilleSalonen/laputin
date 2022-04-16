import { Command, Flags } from '@oclif/core';
import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import { SceneDetector } from '../laputin/scenedetector';

export default class DetectScenesCommand extends Command {
    static description =
        'Detects individual scenes within video files using PySceneDetect';

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
        const { args, flags } = await this.parse(DetectScenesCommand);

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);
        const library = new Library(libraryPath);
        const sceneDetector = new SceneDetector(flags.library, library);
        await sceneDetector.detectMissingScenes(flags.file || '');
    }
}
