import * as fs from 'fs';
import * as path from 'path';

import { Library } from './library';
import { Screenshotter } from './screenshotter';
import { SceneDetector } from './scenedetector';
import { File } from './file';

export class FileDataMigrator {
    constructor(
        private library: Library,
        private screenshotter: Screenshotter,
        private sceneDetector: SceneDetector
    ) {}

    public async migrateAllData(
        sourceFile: File,
        targetFile: File
    ): Promise<void> {
        await this.migrateTags(sourceFile, targetFile);
        this.screenshotter.copyScreenshot(sourceFile, targetFile);
        await this.migrateTimecodes(sourceFile, targetFile);
        await this.migrateScenes(sourceFile, targetFile);
    }

    private async migrateTags(
        sourceFile: File,
        targetFile: File
    ): Promise<void> {
        await this.library.clearAllTagsAndTimecodesFromFile(targetFile.fileId);

        for (const tag of sourceFile.tags) {
            await this.library.createNewLinkBetweenTagAndFile(
                tag,
                targetFile.hash
            );
        }
    }

    private async migrateTimecodes(
        sourceFile: File,
        targetFile: File
    ): Promise<void> {
        const timecodes = await this.library.getTimecodesForFile(
            sourceFile.hash
        );
        for (const timecode of timecodes) {
            const sourcePath = this.screenshotter.getTagTimecodeThumbPath(
                timecode
            );
            const sourceSmallPath = this.screenshotter.getTagTimecodeThumbSmallPath(
                timecode
            );
            timecode.timecodeId = NaN;
            timecode.hash = targetFile.hash;
            const newTimecode = await this.library.addTimecodeToFile(
                timecode,
                targetFile.hash
            );
            const targetPath = this.screenshotter.getTagTimecodeThumbPath(
                newTimecode
            );
            const targetSmallPath = this.screenshotter.getTagTimecodeThumbSmallPath(
                newTimecode
            );

            fs.copyFileSync(sourcePath, targetPath);
            fs.copyFileSync(sourceSmallPath, targetSmallPath);
        }
    }

    private async migrateScenes(
        sourceFile: File,
        targetFile: File
    ): Promise<void> {
        const sourceSceneDirectory = this.sceneDetector.getSceneDirectory(
            sourceFile
        );
        const targetSceneDirectory = this.sceneDetector.getSceneDirectory(
            targetFile
        );

        if (fs.existsSync(sourceSceneDirectory)) {
            if (fs.existsSync(targetSceneDirectory)) {
                fs.rmdirSync(targetSceneDirectory, { recursive: true });
            }

            fs.mkdirSync(targetSceneDirectory);

            const sourceSceneFiles = fs.readdirSync(sourceSceneDirectory);
            for (const sourceSceneFile of sourceSceneFiles) {
                const targetSceneFile = sourceSceneFile.replace(
                    '' + sourceFile.fileId,
                    '' + targetFile.fileId
                );

                const sourceFileFullPath = path.join(
                    sourceSceneDirectory,
                    sourceSceneFile
                );
                const targetFileFullPath = path.join(
                    targetSceneDirectory,
                    targetSceneFile
                );

                fs.copyFileSync(sourceFileFullPath, targetFileFullPath);
            }
        }
    }
}
