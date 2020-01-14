import commandLineArgs = require('command-line-args');

import { Command } from './command';
import { getLibraryPath } from '..';
import { Library } from '../library';
import { SceneDetector } from '../scenedetector';

export class DetectScenesCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', type: String, defaultOption: true },
        { name: 'fileName', type: String }
    ];

    public async execute(options: any): Promise<void> {
        const libraryPath = getLibraryPath(options.libraryPath);

        const library = new Library(libraryPath);
        const sceneDetector = new SceneDetector(options.libraryPath, library);
        await sceneDetector.detectMissingScenes(options.fileName || '');
    }
}
