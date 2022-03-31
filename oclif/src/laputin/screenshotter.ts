import fs = require('fs');
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
    private _initialized: boolean = false;

    constructor(private _libraryPath: string, private _library: Library) {
        this._thumbsPath = path.join(this._libraryPath, '//.laputin//thumbs//');
        this._thumbsSmallPath = path.join(
            this._libraryPath,
            '//.laputin//thumbs-small//'
        );
        this._tagTimecodeThumbsPath = path.join(
            this._libraryPath,
            '//.laputin//tag-timecode-thumbs//'
        );
        this._tagTimecodeThumbsSmallPath = path.join(
            this._libraryPath,
            '//.laputin//tag-timecode-thumbs-small//'
        );
        this._tagThumbsPath = path.join(
            this._libraryPath,
            '//.laputin//tag-thumbs//'
        );
        this._tagThumbsSmallPath = path.join(
            this._libraryPath,
            '//.laputin//tag-thumbs-small//'
        );
    }

    public exists(file: File): boolean {
        this.initialize();

        return (
            fs.existsSync(this.getThumbPath(file)) &&
            fs.existsSync(this.getThumbSmallPath(file))
        );
    }

    public async setScreenshot(file: File, path: string): Promise<void> {
        const thumbPath = this.getThumbPath(file);

        fs.copyFileSync(path, thumbPath);
        const command = `ffmpeg -y -i "${thumbPath}" -vf scale=800:-1 "${this.getThumbSmallPath(
            file
        )}"`;
        child_process.execSync(command, options);
    }

    public async screenshot(file: File, timeInSeconds: number): Promise<void> {
        this.initialize();

        if (file.type.startsWith('video')) {
            const command = `ffmpeg -y -ss ${timeInSeconds} -i "${
                file.path
            }" -vframes 1 "${this.getThumbPath(file)}"`;

            const commandSmall = `ffmpeg -y -ss ${timeInSeconds}  -i "${
                file.path
            }" -vframes 1 -vf scale=800:-1 "${this.getThumbSmallPath(file)}"`;

            try {
                child_process.execSync(command, options);
                child_process.execSync(commandSmall, options);
                this._library.storeTimeForFileScreenshot(file, timeInSeconds);
                winston.log(
                    'verbose',
                    'Created screenshot for ' + file.path + '.'
                );
            } catch (err) {
                winston.log(
                    'error',
                    'Could not create screenshot for ' + file.path + '!'
                );
            }
        } else if (file.type.startsWith('image')) {
            const commandSmall = `ffmpeg -y  -i "${
                file.path
            }" -vf scale=800:-1 "${this.getThumbSmallPath(file)}"`;

            try {
                child_process.execSync(commandSmall);
                this._library.storeTimeForFileScreenshot(file, timeInSeconds);
                winston.log(
                    'verbose',
                    'Created screenshot for ' + file.path + '.'
                );
            } catch (err) {
                winston.log(
                    'error',
                    'Could not create screenshot for ' + file.path + '!'
                );
            }
        }
    }

    public async screenshotTimecode(
        file: File,
        timecode: Timecode,
        timeInSeconds?: number
    ): Promise<void> {
        this.initialize();

        if (!timeInSeconds) {
            timeInSeconds =
                timecode.start + (timecode.end - timecode.start) * 0.66;
        }

        const command = `ffmpeg -y -ss ${timeInSeconds} -i "${
            file.path
        }" -vframes 1 "${this.getTagTimecodeThumbPath(timecode)}"`;

        const commandSmall = `ffmpeg -y -ss ${timeInSeconds} -i "${
            file.path
        }" -vframes 1 -vf scale=800:-1 "${this.getTagTimecodeThumbSmallPath(
            timecode
        )}"`;

        try {
            child_process.execSync(command, options);
            child_process.execSync(commandSmall, options);
            this._library.storeTimeForTimecodeScreenshot(
                timecode,
                timeInSeconds
            );
            winston.log(
                'verbose',
                'Created screenshot for ' +
                    file.path +
                    ' and timecode ID ' +
                    timecode.timecodeId +
                    '.'
            );
        } catch (err) {
            winston.log(
                'error',
                'Could not create screenshot for ' + file.path + '!'
            );
        }
    }

    public async screenshotTag(
        tag: Tag,
        file: File,
        timeInSeconds: number
    ): Promise<void> {
        this.initialize();

        const command = `ffmpeg -y -ss ${timeInSeconds} -i "${
            file.path
        }" -vframes 1 "${this.getTagThumbPath(tag)}"`;

        const commandSmall = `ffmpeg -y -ss ${timeInSeconds} -i "${
            file.path
        }" -vframes 1 -vf scale=800:-1 "${this.getTagThumbSmallPath(tag)}"`;

        try {
            child_process.execSync(command, options);
            child_process.execSync(commandSmall, options);
            this._library.storeTimeForTagScreenshot(tag, file, timeInSeconds);
            winston.log(
                'verbose',
                'Created screenshot for tag ' +
                    tag.name +
                    ' from file ' +
                    file.path +
                    '.'
            );
        } catch (err) {
            winston.log(
                'error',
                'Could not create screenshot for tag ' + tag.name + '!'
            );
        }
    }

    private initialize(): void {
        if (this._initialized) {
            return;
        }

        const laputinHiddenDir = path.join(this._libraryPath, '//.laputin//');

        if (!fs.existsSync(laputinHiddenDir)) {
            winston.log(
                'verbose',
                'Created directory ' + laputinHiddenDir + '.'
            );
            fs.mkdirSync(laputinHiddenDir);
        }

        if (!fs.existsSync(this._thumbsPath)) {
            winston.log(
                'verbose',
                'Created directory ' + this._thumbsPath + '.'
            );
            fs.mkdirSync(this._thumbsPath);
        }

        if (!fs.existsSync(this._thumbsSmallPath)) {
            winston.log(
                'verbose',
                'Created directory ' + this._thumbsSmallPath + '.'
            );
            fs.mkdirSync(this._thumbsSmallPath);
        }

        if (!fs.existsSync(this._tagTimecodeThumbsPath)) {
            winston.log(
                'verbose',
                'Created directory ' + this._tagTimecodeThumbsPath + '.'
            );
            fs.mkdirSync(this._tagTimecodeThumbsPath);
        }

        if (!fs.existsSync(this._tagTimecodeThumbsSmallPath)) {
            winston.log(
                'verbose',
                'Created directory ' + this._tagTimecodeThumbsSmallPath + '.'
            );
            fs.mkdirSync(this._tagTimecodeThumbsSmallPath);
        }

        this._initialized = true;
    }

    private getThumbPath(file: File) {
        return path.join(this._thumbsPath, file.hash + '.jpg');
    }

    private getThumbSmallPath(file: File) {
        return path.join(this._thumbsSmallPath, file.hash + '.jpg');
    }

    public getTagTimecodeThumbPath(timecode: Timecode) {
        return path.join(
            this._tagTimecodeThumbsPath,
            timecode.timecodeId + '.jpg'
        );
    }

    public getTagTimecodeThumbSmallPath(timecode: Timecode) {
        return path.join(
            this._tagTimecodeThumbsSmallPath,
            timecode.timecodeId + '.jpg'
        );
    }

    private getTagThumbPath(tag: Tag) {
        return path.join(this._tagThumbsPath, tag.id + '.jpg');
    }

    private getTagThumbSmallPath(tag: Tag) {
        return path.join(this._tagThumbsSmallPath, tag.id + '.jpg');
    }
}
