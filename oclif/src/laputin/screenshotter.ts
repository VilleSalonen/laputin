import fs = require('fs/promises');
import * as fsLegacy from 'fs';
import child_process = require('child_process');
import path = require('path');
import winston = require('winston');

import { File } from './file';
import { Timecode, Tag } from './tag';
import { Library } from './library';

const options: any = { stdio: 'pipe' };

export class Screenshotter {
    private _thumbsPath: string;
    private _thumbsSmallPath: string;
    private _tagTimecodeThumbsPath: string;
    private _tagTimecodeThumbsSmallPath: string;
    private _tagThumbsPath: string;
    private _tagThumbsSmallPath: string;
    private _initialized = false;

    constructor(private _libraryPath: string, private _library: Library) {
        this._thumbsPath = path.join(this._libraryPath, '//public//thumbs//');
        this._thumbsSmallPath = path.join(this._libraryPath, '//public//thumbs-small//');
        this._tagTimecodeThumbsPath = path.join(this._libraryPath, '//public//tag-timecode-thumbs//');
        this._tagTimecodeThumbsSmallPath = path.join(this._libraryPath, '//public//tag-timecode-thumbs-small//');
        this._tagThumbsPath = path.join(this._libraryPath, '//public//tag-thumbs//');
        this._tagThumbsSmallPath = path.join(this._libraryPath, '//public//tag-thumbs-small//');
    }

    public exists(file: File): boolean {
        this.initialize();

        return fsLegacy.existsSync(this.getThumbPath(file)) && fsLegacy.existsSync(this.getThumbSmallPath(file));
    }

    public async setScreenshot(file: File, path: string): Promise<void> {
        const thumbPath = this.getThumbPath(file);

        await fs.copyFile(path, thumbPath);
        const command = `ffmpeg -y -i "${thumbPath}" -vf scale=800:-1 "${this.getThumbSmallPath(file)}"`;
        child_process.execSync(command, options);
    }

    public async screenshot(file: File, timeInSeconds: number): Promise<void> {
        await this.initialize();

        if (file.type.startsWith('video')) {
            const duration = Math.floor(parseFloat(file.metadata.duration));
            if (timeInSeconds > duration) {
                const newTimeInSeconds = duration / 2;
                winston.verbose(
                    `Screenshot was requested at ${timeInSeconds} seconds but duration is only ${duration} seconds. Screenshot will be taken at ${newTimeInSeconds} seconds.`
                );
                timeInSeconds = newTimeInSeconds;
            }

            const command = `ffmpeg -y -ss ${timeInSeconds} -i "${file.path}" -vframes 1 "${this.getThumbPath(file)}"`;

            const commandSmall = `ffmpeg -y -ss ${timeInSeconds}  -i "${
                file.path
            }" -vframes 1 -vf scale=800:-1 "${this.getThumbSmallPath(file)}"`;

            try {
                child_process.execSync(command, options);
                child_process.execSync(commandSmall, options);
                await this._library.storeTimeForFileScreenshot(file, timeInSeconds);
                winston.log('verbose', 'Created screenshot for ' + file.path + '.');
            } catch (err) {
                winston.log('error', 'Could not create screenshot for ' + file.path + '!');
            }
        } else if (file.type.startsWith('image')) {
            const commandSmall = `ffmpeg -y  -i "${file.path}" -vf scale=800:-1 "${this.getThumbSmallPath(file)}"`;

            try {
                child_process.execSync(commandSmall);
                await this._library.storeTimeForFileScreenshot(file, timeInSeconds);
                winston.log('verbose', 'Created screenshot for ' + file.path + '.');
            } catch (err) {
                winston.log('error', 'Could not create screenshot for ' + file.path + '!');
            }
        }
    }

    public async screenshotTimecode(file: File, timecode: Timecode, timeInSeconds?: number): Promise<void> {
        await this.initialize();

        if (!timeInSeconds) {
            timeInSeconds = timecode.start + (timecode.end - timecode.start) * 0.66;
        }

        const command = `ffmpeg -y -ss ${timeInSeconds} -i "${file.path}" -vframes 1 "${this.getTagTimecodeThumbPath(
            timecode
        )}"`;

        const commandSmall = `ffmpeg -y -ss ${timeInSeconds} -i "${
            file.path
        }" -vframes 1 -vf scale=800:-1 "${this.getTagTimecodeThumbSmallPath(timecode)}"`;

        try {
            child_process.execSync(command, options);
            child_process.execSync(commandSmall, options);
            this._library.storeTimeForTimecodeScreenshot(timecode, timeInSeconds);
            winston.log(
                'verbose',
                'Created screenshot for ' + file.path + ' and timecode ID ' + timecode.timecodeId + '.'
            );
        } catch (err) {
            winston.log('error', 'Could not create screenshot for ' + file.path + '!');
        }
    }

    public async screenshotTag(tag: Tag, file: File, timeInSeconds: number): Promise<void> {
        await this.initialize();

        const command = `ffmpeg -y -ss ${timeInSeconds} -i "${file.path}" -vframes 1 "${this.getTagThumbPath(tag)}"`;

        const commandSmall = `ffmpeg -y -ss ${timeInSeconds} -i "${
            file.path
        }" -vframes 1 -vf scale=800:-1 "${this.getTagThumbSmallPath(tag)}"`;

        try {
            child_process.execSync(command, options);
            child_process.execSync(commandSmall, options);
            this._library.storeTimeForTagScreenshot(tag, file, timeInSeconds);
            winston.log('verbose', 'Created screenshot for tag ' + tag.name + ' from file ' + file.path + '.');
        } catch (err) {
            winston.log('error', 'Could not create screenshot for tag ' + tag.name + '!');
        }
    }

    public async copyScreenshot(sourceFile: File, targetFile: File) {
        await fs.copyFile(this.getThumbPath(sourceFile), this.getThumbPath(targetFile));
        await fs.copyFile(this.getThumbSmallPath(sourceFile), this.getThumbSmallPath(targetFile));
    }

    private async initialize(): Promise<void> {
        if (this._initialized) {
            return;
        }

        const laputinHiddenDir = path.join(this._libraryPath, '//public//');
        await this.createThumbnailDirectory(laputinHiddenDir);

        await this.createThumbnailDirectory(this._thumbsPath);
        await this.createThumbnailDirectory(this._thumbsSmallPath);
        await this.createThumbnailDirectory(this._tagTimecodeThumbsPath);
        await this.createThumbnailDirectory(this._tagTimecodeThumbsSmallPath);

        this._initialized = true;
    }

    private async createThumbnailDirectory(directory: string): Promise<void> {
        if (!fsLegacy.existsSync(directory)) {
            winston.log('verbose', `Created directory ${directory}.`);
            await fs.mkdir(directory);
        }
    }

    private getThumbPath(file: File) {
        return path.join(this._thumbsPath, file.fileId + '.jpg');
    }

    private getThumbSmallPath(file: File) {
        return path.join(this._thumbsSmallPath, file.fileId + '.jpg');
    }

    public getTagTimecodeThumbPath(timecode: Timecode) {
        return path.join(this._tagTimecodeThumbsPath, timecode.timecodeId + '.jpg');
    }

    public getTagTimecodeThumbSmallPath(timecode: Timecode) {
        return path.join(this._tagTimecodeThumbsSmallPath, timecode.timecodeId + '.jpg');
    }

    private getTagThumbPath(tag: Tag) {
        return path.join(this._tagThumbsPath, tag.id + '.jpg');
    }

    private getTagThumbSmallPath(tag: Tag) {
        return path.join(this._tagThumbsSmallPath, tag.id + '.jpg');
    }
}
