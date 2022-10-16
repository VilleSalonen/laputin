import child_process = require('child_process');
import * as fs from 'fs';
import * as path from 'path';

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
        return path.join(this.getScenesDirectory(), file.hash + '/');
    }

    public async detectMissingScenes(filenameForQuery: string) {
        const scenesDirectory = this.getScenesDirectory();

        if (!fs.existsSync(scenesDirectory)) {
            fs.mkdirSync(scenesDirectory);
            winston.verbose(
                `Created Laputin scenes directory: ${scenesDirectory}`
            );
        }

        const files = await this.library.getFiles(
            new Query(filenameForQuery, [], '', undefined, '', '', '', false)
        );
        if (files.length === 0) {
            winston.warn(
                `Could not find any files with filename query ${filenameForQuery}`
            );
            return;
        }

        winston.verbose(
            `Found ${files.length} files with filename query ${filenameForQuery}`
        );

        for (const file of files) {
            try {
                winston.verbose(`${file.hash} = ${file.path}`);

                const sceneDirectory = this.getSceneDirectory(file);
                if (!fs.existsSync(sceneDirectory)) {
                    fs.mkdirSync(sceneDirectory);
                    winston.verbose(
                        `Created scene directory: ${sceneDirectory}`
                    );
                }

                const analysisCsvPath = path.join(
                    sceneDirectory,
                    `${file.hash}-Scenes.csv`
                );
                const analysisJsonPath = path.join(
                    sceneDirectory,
                    `${file.hash}-Scenes.json`
                );

                if (!fs.existsSync(analysisCsvPath)) {
                    const targetPath = path.join(
                        sceneDirectory,
                        `${file.hash}.mp4`
                    );
                    const createdDownscaledVersion = this.createDownscaledVideoIfDoesNotExist(
                        file,
                        sceneDirectory,
                        targetPath
                    );

                    this.detectScenes(
                        analysisCsvPath,
                        targetPath,
                        sceneDirectory
                    );

                    if (createdDownscaledVersion) {
                        fs.unlinkSync(targetPath);
                    }
                }

                const scenes = await this.parseScenes(analysisCsvPath);

                if (!fs.existsSync(analysisJsonPath)) {
                    fs.writeFileSync(analysisJsonPath, JSON.stringify(scenes));
                }

                this.generateMissingSceneScreenshots(
                    file,
                    sceneDirectory,
                    scenes
                );
            } catch (err) {
                winston.error(
                    `Could not detect scenes for ${file.path}! Error: `,
                    err
                );
            }
        }
    }

    private createDownscaledVideoIfDoesNotExist(
        file: File,
        sceneDirectory: string,
        targetPath: string
    ): boolean {
        if (fs.existsSync(targetPath)) {
            return false;
        }

        const incompleteTargetPath = path.join(
            sceneDirectory,
            `${file.hash}_INCOMPLETE.mp4`
        );
        const command = `ffmpeg -y -i "${file.path}" -vcodec h264_nvenc -preset fast -vf "scale=w=320:h=180" -an "${incompleteTargetPath}"`;

        winston.verbose(
            `Generating downscaled version for faster scene detection: ${targetPath}`
        );
        try {
            child_process.execSync(command, options);
        } catch (err) {
            // OK
        }

        if (!fs.existsSync(incompleteTargetPath)) {
            throw new Error(
                `Attempt to move ${incompleteTargetPath} to ${targetPath} but downscaled version could not be found!`
            );
        }

        fs.renameSync(incompleteTargetPath, targetPath);

        return true;
    }

    private detectScenes(
        analysisCsvPath: string,
        targetPath: string,
        sceneDirectory: string
    ): void {
        // There's some problem with passing paths with spaces to scenedetect. To work around this we change working
        // directory to target scene directory before running scenedetect.
        process.chdir(sceneDirectory);
        const command2 = `scenedetect.exe --input "${targetPath}" detect-content list-scenes`;
        winston.verbose(`Detecting scenes to: ${analysisCsvPath}`);
        child_process.execSync(command2, options);

        if (!fs.existsSync(analysisCsvPath)) {
            throw new Error(
                `Could not find scene analysis CSV file at ${analysisCsvPath}!`
            );
        }
    }

    private async parseScenes(analysisCsvPath: string): Promise<any[]> {
        const csvContent = fs
            .readFileSync(analysisCsvPath)
            .toString()
            .split('\n')
            .slice(1)
            .join('\n');

        return await csv().fromString(csvContent);
    }

    private generateMissingSceneScreenshots(
        file: File,
        sceneDirectory: string,
        scenes: any[]
    ): void {
        winston.verbose(`Generating thumbnails for ${scenes.length} scenes...`);
        for (const scene of scenes) {
            const sceneNumber = parseInt(scene['Scene Number'], 10);
            const sceneStart = parseFloat(scene['Start Time (seconds)']);
            const sceneEnd = parseFloat(scene['End Time (seconds)']);

            const time1 = sceneStart + ((sceneEnd - sceneStart) / 10) * 2;
            const time2 = sceneStart + ((sceneEnd - sceneStart) / 10) * 5;
            const time3 = sceneStart + ((sceneEnd - sceneStart) / 10) * 8;

            const path1 = path.join(
                sceneDirectory,
                file.hash + '_' + sceneNumber + '_1.jpg'
            );
            const path2 = path.join(
                sceneDirectory,
                file.hash + '_' + sceneNumber + '_2.jpg'
            );
            const path3 = path.join(
                sceneDirectory,
                file.hash + '_' + sceneNumber + '_3.jpg'
            );

            if (!fs.existsSync(path1)) {
                try {
                    child_process.execSync(
                        `ffmpeg -y -ss ${time1} -i "${file.path}" -vf scale=150:-1 -vframes 1 "${path1}"`,
                        options
                    );
                } catch (err) {
                    // OK
                }
            }
            if (!fs.existsSync(path2)) {
                try {
                    child_process.execSync(
                        `ffmpeg -y -ss ${time2} -i "${file.path}" -vf scale=150:-1 -vframes 1 "${path2}"`,
                        options
                    );
                } catch (err) {
                    // OK
                }
            }
            if (!fs.existsSync(path3)) {
                try {
                    child_process.execSync(
                        `ffmpeg -y -ss ${time3} -i "${file.path}" -vf scale=150:-1 -vframes 1 "${path3}"`,
                        options
                    );
                } catch (err) {
                    // OK
                }
            }
        }
    }
}
