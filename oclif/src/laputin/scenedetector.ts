import child_process = require('child_process');
import fs = require('fs/promises');
import fsLegacy = require('fs');
import path = require('path');

import { Library } from './library';
import { Query } from './query.model';
import winston = require('winston');
import { File } from './file';

import csv = require('csvtojson');

const options: any = { stdio: 'pipe' };

export class SceneDetector {
    constructor(private libraryPath: string, private library: Library) {}

    public getScenesDirectory(): string {
        return path.join(this.libraryPath, '//public//scenes//');
    }

    public getSceneDirectory(file: File): string {
        return path.join(this.getScenesDirectory(), file.fileId + '/');
    }

    public async detectMissingScenes(query: Query, performFullCheck: boolean) {
        const scenesDirectory = this.getScenesDirectory();

        if (!fsLegacy.existsSync(scenesDirectory)) {
            await fs.mkdir(scenesDirectory);
            winston.verbose(`Created Laputin scenes directory: ${scenesDirectory}`);
        }

        const files = await this.library.getFiles(query);
        if (files.length === 0) {
            winston.warn(`Could not find any files with filename query ${JSON.stringify(query)}`);
            return;
        }

        winston.verbose(`Found ${files.length} files with filename query ${JSON.stringify(query)}`);

        for (const file of files) {
            try {
                winston.verbose(`${file.fileId} = ${file.path}`);

                if (file.metadata?.scenes?.ignore) {
                    winston.verbose(`File ${file.path} has scenes ignore set, skipping...`);
                    continue;
                }

                const sceneDirectory = this.getSceneDirectory(file);
                const sceneDirectoryExists = fsLegacy.existsSync(sceneDirectory);

                // If scene directory exists and user did not request full check we need to skip checking the every
                // individual screenshot as that takes a looong time.
                //
                // Note: some scenes may be incomplete or are missing screenshots. User can fix these by running
                // full check for specific files.
                if (sceneDirectoryExists && !performFullCheck) {
                    continue;
                }

                if (!sceneDirectoryExists) {
                    await fs.mkdir(sceneDirectory);
                    winston.verbose(`Created scene directory: ${sceneDirectory}`);
                }

                const analysisCsvPath = path.join(sceneDirectory, `${file.fileId}-Scenes.csv`);
                const analysisCsvExists = fsLegacy.existsSync(analysisCsvPath);

                if (!analysisCsvExists) {
                    const targetPath = path.join(sceneDirectory, `${file.fileId}.mp4`);
                    const createdDownscaledVersion = await this.createDownscaledVideo(file, sceneDirectory, targetPath);

                    await this.detectScenes(analysisCsvPath, targetPath, sceneDirectory);

                    if (createdDownscaledVersion) {
                        await fs.unlink(targetPath);
                    }
                }

                const scenes = await this.parseScenes(analysisCsvPath);
                const analysisJsonPath = path.join(sceneDirectory, `${file.fileId}-Scenes.json`);
                const analysisJsonExists = fsLegacy.existsSync(analysisJsonPath);

                if (!analysisJsonExists) {
                    await fs.writeFile(analysisJsonPath, JSON.stringify(scenes));
                }

                await this.generateMissingSceneScreenshots(file, sceneDirectory, scenes);
            } catch (err) {
                winston.error(`Could not detect scenes for ${file.path}! Error: `, err);
            }
        }
    }

    private async createDownscaledVideo(file: File, sceneDirectory: string, targetPath: string): Promise<boolean> {
        const incompleteTargetPath = path.join(sceneDirectory, `${file.fileId}_INCOMPLETE.mp4`);

        const incompleteTargetExists1 = fsLegacy.existsSync(incompleteTargetPath);
        if (incompleteTargetExists1) {
            await fs.unlink(incompleteTargetPath);
        }

        const targetExists = fsLegacy.existsSync(targetPath);
        if (targetExists) {
            await fs.unlink(targetPath);
        }

        const command = `ffmpeg -y -i "${file.path}" -vcodec h264_nvenc -preset fast -vf "scale=w=320:h=180" -an "${incompleteTargetPath}"`;

        winston.verbose(`Generating downscaled version for faster scene detection: ${targetPath}`);
        try {
            child_process.execSync(command, options);
        } catch (err) {
            // OK
        }

        const incompleteTargetExists2 = fsLegacy.existsSync(incompleteTargetPath);
        if (!incompleteTargetExists2) {
            throw new Error(
                `Attempt to move ${incompleteTargetPath} to ${targetPath} but downscaled version could not be found!`
            );
        }

        await fs.rename(incompleteTargetPath, targetPath);

        return true;
    }

    private async detectScenes(analysisCsvPath: string, targetPath: string, sceneDirectory: string): Promise<void> {
        // There's some problem with passing paths with spaces to scenedetect. To work around this we change working
        // directory to target scene directory before running scenedetect.
        process.chdir(sceneDirectory);
        const command2 = `scenedetect.exe --input "${targetPath}" detect-content list-scenes`;
        winston.verbose(`Detecting scenes to: ${analysisCsvPath}`);
        child_process.execSync(command2, options);

        if (!fsLegacy.existsSync(analysisCsvPath)) {
            throw new Error(`Could not find scene analysis CSV file at ${analysisCsvPath}!`);
        }
    }

    private async parseScenes(analysisCsvPath: string): Promise<any[]> {
        const csvContent = (await fs.readFile(analysisCsvPath)).toString().split('\n').slice(1).join('\n');
        return await csv().fromString(csvContent);
    }

    private async generateMissingSceneScreenshots(file: File, sceneDirectory: string, scenes: any[]): Promise<void> {
        const existingFiles = await fs.readdir(sceneDirectory);
        const existingThumbnails = existingFiles.filter((fileName) => fileName.endsWith('.jpg'));

        if (scenes.length * 3 === existingThumbnails.length) {
            winston.verbose(
                `Scene directory contains expected ${existingThumbnails.length} thumbnails for ${scenes.length} scenes, skipping.`
            );
            return;
        }

        winston.verbose(`Generating thumbnails for ${scenes.length} scenes...`);
        for (const scene of scenes) {
            const sceneNumber = parseInt(scene['Scene Number'], 10);
            const sceneStart = parseFloat(scene['Start Time (seconds)']);
            const sceneEnd = parseFloat(scene['End Time (seconds)']);

            const time1 = sceneStart + ((sceneEnd - sceneStart) / 10) * 2;
            const time2 = sceneStart + ((sceneEnd - sceneStart) / 10) * 5;
            const time3 = sceneStart + ((sceneEnd - sceneStart) / 10) * 8;

            const path1 = path.join(sceneDirectory, `${file.fileId}_${sceneNumber}_1.jpg`);
            const path2 = path.join(sceneDirectory, `${file.fileId}_${sceneNumber}_2.jpg`);
            const path3 = path.join(sceneDirectory, `${file.fileId}_${sceneNumber}_3.jpg`);

            await this.createSceneThumb(file, time1, path1);
            await this.createSceneThumb(file, time2, path2);
            await this.createSceneThumb(file, time3, path3);
        }
    }

    private async createSceneThumb(file: File, time: number, path: string): Promise<void> {
        if (fsLegacy.existsSync(path)) {
            return;
        }

        try {
            child_process.execSync(
                `ffmpeg -y -ss ${time} -i "${file.path}" -vf scale=150:-1 -vframes 1 "${path}"`,
                options
            );
        } catch (err) {
            // OK
        }
    }
}
