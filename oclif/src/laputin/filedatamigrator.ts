import fs = require('fs/promises');
import * as fsLegacy from 'fs';
import path = require('path');

import { Library } from './library';
import { Screenshotter } from './screenshotter';
import { SceneDetector } from './scenedetector';
import { File } from './file';

export class FileDataMigrator {
    constructor(private library: Library, private screenshotter: Screenshotter, private sceneDetector: SceneDetector) {}

    public async migrateAllData(sourceFile: File, targetFile: File): Promise<void> {
        await this.migrateTags(sourceFile, targetFile);
        this.screenshotter.copyScreenshot(sourceFile, targetFile);
        await this.migrateTimecodes(sourceFile, targetFile);
        await this.migrateScenes(sourceFile, targetFile);
    }

    private async migrateTags(sourceFile: File, targetFile: File): Promise<void> {
        await this.library.clearAllTagsAndTimecodesFromFile(targetFile.fileId);

        for (const tag of sourceFile.tags) {
            await this.library.createNewLinkBetweenTagAndFile(tag, targetFile.hash);
        }
    }

    private async migrateTimecodes(sourceFile: File, targetFile: File): Promise<void> {
        const timecodes = await this.library.getTimecodesForFile(sourceFile);
        for (const timecode of timecodes) {
            const sourcePath = this.screenshotter.getTagTimecodeThumbPath(timecode);
            const sourceSmallPath = this.screenshotter.getTagTimecodeThumbSmallPath(timecode);
            timecode.timecodeId = NaN;
            timecode.fileId = targetFile.fileId;
            const newTimecode = await this.library.addTimecodeToFile(timecode, targetFile.hash);
            const targetPath = this.screenshotter.getTagTimecodeThumbPath(newTimecode);
            const targetSmallPath = this.screenshotter.getTagTimecodeThumbSmallPath(newTimecode);

            await fs.copyFile(sourcePath, targetPath);
            await fs.copyFile(sourceSmallPath, targetSmallPath);
        }
    }

    private async migrateScenes(sourceFile: File, targetFile: File): Promise<void> {
        const sourceSceneDirectory = this.sceneDetector.getSceneDirectory(sourceFile);
        const targetSceneDirectory = this.sceneDetector.getSceneDirectory(targetFile);

        if (fsLegacy.existsSync(sourceSceneDirectory)) {
            if (fsLegacy.existsSync(targetSceneDirectory)) {
                await fs.rmdir(targetSceneDirectory, { recursive: true });
            }

            await fs.mkdir(targetSceneDirectory);

            const sourceSceneFiles = await fs.readdir(sourceSceneDirectory);
            for (const sourceSceneFile of sourceSceneFiles) {
                const targetSceneFile = sourceSceneFile.replace('' + sourceFile.fileId, '' + targetFile.fileId);

                const sourceFileFullPath = path.join(sourceSceneDirectory, sourceSceneFile);
                const targetFileFullPath = path.join(targetSceneDirectory, targetSceneFile);

                await fs.copyFile(sourceFileFullPath, targetFileFullPath);
            }
        }
    }
}
