import _ = require('lodash');
import fs = require('fs');
import child_process = require('child_process');
import path = require('path');
import os = require('os');
import winston = require('winston');

import {File} from './file';
import { TagTimecode } from './tag';

export class Screenshotter {
    private _thumbsPath: string;
    private _thumbsSmallPath: string;
    private _tagTimecodeThumbsPath: string;
    private _tagTimecodeThumbsSmallPath: string;
    private _initialized: boolean;

    constructor(private _libraryPath: string) {
        this._thumbsPath = path.join(this._libraryPath, '//.laputin//thumbs//');
        this._thumbsSmallPath = path.join(this._libraryPath, '//.laputin//thumbs-small//');
        this._tagTimecodeThumbsPath = path.join(this._libraryPath, '//.laputin//tag-timecode-thumbs//');
        this._tagTimecodeThumbsSmallPath = path.join(this._libraryPath, '//.laputin//tag-timecode-thumbs-small//');
    }

    public exists(file: File): boolean {
        this.initialize();

        return fs.existsSync(this.getThumbPath(file)) && fs.existsSync(this.getThumbSmallPath(file));
    }

    public async screenshot(file: File, timeInSeconds: number): Promise<void> {
        this.initialize();

        const command = '"C:\\Tools\\ffmpeg.exe" -y -ss ' + timeInSeconds +
            ' -i "' + file.path +
            '" -vframes 1 ' +
            '"' + this.getThumbPath(file) + '"';

        const commandSmall = '"C:\\Tools\\ffmpeg.exe" -y -ss ' + timeInSeconds +
            ' -i "' + file.path +
            '" -vframes 1 -vf scale=200:-1 ' +
            '"' + this.getThumbSmallPath(file) + '"';

        try {
            child_process.execSync(command);
            child_process.execSync(commandSmall);
            winston.log('verbose', 'Created screenshot for ' + file.path + '.');
        } catch (err) {
            winston.log('error', 'Could not create screenshot for ' + file.path + '!');
        }
    }

    public async screenshotTagTimecode(file: File, tagTimecode: TagTimecode, timeInSeconds: number): Promise<void> {
        this.initialize();

        const command = '"C:\\Tools\\ffmpeg.exe" -y -ss ' + timeInSeconds +
            ' -i "' + file.path +
            '" -vframes 1 ' +
            '"' + this.getTagTimecodeThumbPath(tagTimecode) + '"';

        const commandSmall = '"C:\\Tools\\ffmpeg.exe" -y -ss ' + timeInSeconds +
            ' -i "' + file.path +
            '" -vframes 1 -vf scale=200:-1 ' +
            '"' + this.getTagTimecodeThumbSmallPath(tagTimecode) + '"';

        try {
            child_process.execSync(command);
            child_process.execSync(commandSmall);
            winston.log('verbose', 'Created screenshot for ' + file.path + ' and tag timecode ' + tagTimecode.name + '.');
        } catch (err) {
            winston.log('error', 'Could not create screenshot for ' + file.path + '!');
        }
    }

    private initialize(): void {
        if (this._initialized) {
            return;
        }

        const laputinHiddenDir = path.join(this._libraryPath, '//.laputin//');

        if (!fs.existsSync(laputinHiddenDir)) {
            winston.log('verbose', 'Created directory ' + laputinHiddenDir + '.');
            fs.mkdirSync(laputinHiddenDir);
        }

        if (!fs.existsSync(this._thumbsPath)) {
            winston.log('verbose', 'Created directory ' + this._thumbsPath + '.');
            fs.mkdirSync(this._thumbsPath);
        }

        if (!fs.existsSync(this._thumbsSmallPath)) {
            winston.log('verbose', 'Created directory ' + this._thumbsSmallPath + '.');
            fs.mkdirSync(this._thumbsSmallPath);
        }

        if (!fs.existsSync(this._tagTimecodeThumbsPath)) {
            winston.log('verbose', 'Created directory ' + this._tagTimecodeThumbsPath + '.');
            fs.mkdirSync(this._tagTimecodeThumbsPath);
        }

        if (!fs.existsSync(this._tagTimecodeThumbsSmallPath)) {
            winston.log('verbose', 'Created directory ' + this._tagTimecodeThumbsSmallPath + '.');
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

    private getTagTimecodeThumbPath(tagTimecode: TagTimecode) {
        return path.join(this._tagTimecodeThumbsPath, tagTimecode.timecodeId + '.jpg');
    }

    private getTagTimecodeThumbSmallPath(tagTimecode: TagTimecode) {
        return path.join(this._tagTimecodeThumbsSmallPath, tagTimecode.timecodeId + '.jpg');
    }
}
