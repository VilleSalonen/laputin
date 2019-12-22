/// <reference path="walk.d.ts" />

import _ = require('lodash');
import walk = require('walk');
import path = require('path');
import watch = require('watch');
import events = require('events');
import winston = require('winston');

import fs = require('fs');
import {promisify} from 'util';
const stat = promisify(fs.stat);

import {IHasher} from './ihasher';
import { File } from './file';
import { Screenshotter } from './screenshotter';
import { Library } from './library';
import { Query } from './query.model';

const probe = require('node-ffprobe');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');

probe.FFPROBE_PATH = ffprobeInstaller.path;

export class FileLibrary extends events.EventEmitter {
    private _existingFiles: {[path: string]: File} = {};

    private _files: { [hash: string]: File[] } = {};
    private _hashesByPaths: { [filePath: string]: string } = {};

    constructor(private library: Library, private _libraryPath: string, private _hasher: IHasher, private _screenshotter: Screenshotter) {
        super();
    }

    public load(performFullCheck: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const query = new Query(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
            this.library.getFiles(query).then((existingFiles: File[]) => {
                this._existingFiles = _.keyBy(existingFiles, f => f.path);

                const walkerOptions = { followLinks: false, filters: ['.laputin'] };
                const walker = walk.walk(this._libraryPath, walkerOptions);
                walker.on('file', (root, walkStat, callback) => { this.processFile(root, walkStat, callback, performFullCheck); });
                walker.on('end', () => {
                    const missingFiles = _.values(this._existingFiles);
                    missingFiles.forEach(file => {
                        this.emit('lost', file);
                    });

                    this.startMonitoring();
                    resolve();
                });
            });
        });
    }

    public close(): void {
        watch.unwatchTree(this._libraryPath);
    }

    public startMonitoring(): void {
        // Start monitoring after library has been hashed. Otherwise changes
        // done to database file cause changed events to be emitted and thus
        // slow down the initial processing.
        watch.createMonitor(this._libraryPath, { 'ignoreDotFiles': true }, (monitor) => {
            // If files are big or copying is otherwise slow, both created and
            // changed events might be emitted for a new file. If this is the
            // case, hashing is not possible during created event and must be
            // done in changed event. However for small files or files that were
            // otherwise copied fast, only created event is emitted.
            //
            // Because of this, hashing and emitting must be done on both
            // events. Based on experiments, if both events are coming, hashing
            // cannot be done on created events. Hasher will swallow the error.
            // Thus each file is hashed and emitted just once even if both
            // events will be emitted.
            monitor.on('created', async (createdPath: string) => {
                const stats = await stat(createdPath);
                this.addFileFromPath(createdPath, stats, false);
            });
            monitor.on('changed', async (changedPath: string) => {
                const stats = await stat(changedPath);
                this.addFileFromPath(changedPath, stats, false);
            });
            monitor.on('removed', (removedPath: string) => this.removeFileFromPath(removedPath));
        });
    }

    private async processFile(root: string, walkStat: walk.WalkStat, next: (() => void), performFullCheck: boolean): Promise<void> {
        const filePath = path.normalize(path.join(root, walkStat.name));
        await this.addFileFromPath(filePath, walkStat, performFullCheck);
        next();
    }

    private async addFileFromPath(filePath: string, stats: fs.Stats, performFullCheck: boolean): Promise<void> {
        if (stats.isDirectory()) { return; }
        if (this.fileShouldBeIgnored(filePath)) { return; }

        const escapedFilePath = filePath.replace(/\\/g, '/');
        if (!performFullCheck && this._existingFiles[escapedFilePath] && this._existingFiles[escapedFilePath].size === stats.size) {
            const file = this._existingFiles[escapedFilePath];
            this.addFileToBookkeeping(file);

            winston.log('verbose', 'File found in same path with same size: ' + filePath);
        } else {
            const hash = await this._hasher.hash(filePath, stats);
            const metadata = await this.readMetadata(filePath);

            const file = new File(hash, filePath, [], stats.size, metadata);
            this.addFileToBookkeeping(file);

            if (!this._screenshotter.exists(file)) {
                await this._screenshotter.screenshot(file, 180);
            }

            this.emit('found', file);

            winston.log('verbose', 'Found file: ' + filePath);
        }

        delete this._existingFiles[escapedFilePath];
    }

    private async readMetadata(filePath: string): Promise<any> {
        const data = await probe(filePath);
        if (data) {
            let isVideo = false;
            let primaryVideoStream;
            for (const stream of data.streams) {
                isVideo = isVideo || stream.codec_type === 'video';
                primaryVideoStream = stream;
                break;
            }

            if (!isVideo) {
                return {};
            }

            return {
                type: 'video',
                codec: primaryVideoStream.codec_name,
                width: primaryVideoStream.width,
                height: primaryVideoStream.height,
                duration: data.format.duration,
                bitrate: data.format.bit_rate,
                framerate: primaryVideoStream.avg_frame_rate
            };
        } else {
            return {};
        }
    }

    private addFileToBookkeeping(file: File): void {
        this.initializeListForHash(file);

        if (!this.identicalFileAlreadyExistsInIdenticalPath(file)) {
            this._files[file.hash].push(file);
            this._hashesByPaths[file.path] = file.hash;
        }
    }

    private fileShouldBeIgnored(filePath: string) {
        return path.basename(filePath).charAt(0) === '.'
            || filePath.indexOf('.git') !== -1
            || filePath.indexOf('.laputin') !== -1
            || filePath.indexOf('Thumbs.db') !== -1;
    }

    private initializeListForHash(file: File): void {
        if (!this._files[file.hash]) {
            this._files[file.hash] = [];
        }
    }

    private identicalFileAlreadyExistsInIdenticalPath(file: File): boolean {
        const files = this._files[file.hash];
        return files.some((fileForChecking: File): boolean => file.path === fileForChecking.path);
    }

    private removeFileFromPath(filePath: string): void {
        // Ugly fix for different path separators
        const fixedPath = filePath.replace(/\\/g, '/');
        const hash = this._hashesByPaths[fixedPath];
        const files = this._files[hash];

        if (!files) {
            return;
        }

        const file = files.find((f: File) => {
            return f.path === fixedPath;
        });

        if (file) {
            this._files[hash] = files.filter((f: File) => {
                return f.path !== fixedPath;
            });

            this.emit('lost', file);

            winston.log('verbose', 'Lost file:  ' + filePath);
        } else {
            winston.log('warning', `Tried to remove file ${filePath} but it was not found from file list via hash ${hash}!`);
        }
    }

    public getDuplicates(): any {
        const duplicates: any = {};

        _.forOwn(this._files, function(files: File[], hash: string) {
            if (files.length > 1) {
                duplicates[hash] = files;
            }
        });

        return duplicates;
    }
}
