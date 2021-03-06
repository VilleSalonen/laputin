/// <reference path="walk.d.ts" />

import _ = require('lodash');
import walk = require('walk');
import path = require('path');
import watch = require('watch');
import events = require('events');
import winston = require('winston');

import fs = require('fs');
import { promisify } from 'util';
const stat = promisify(fs.stat);

import { IHasher } from './ihasher';
import { File } from './file';
import { Screenshotter } from './screenshotter';
import { Library } from './library';
import { Query } from './query.model';
import { LaputinConfiguration } from './laputinconfiguration';

const readChunk = require('read-chunk');
const fileType = require('file-type');

const probe = require('node-ffprobe');

export class FileLibrary extends events.EventEmitter {
    private _existingFiles: { [path: string]: File } = {};

    private _files: { [hash: string]: File[] } = {};
    private _hashesByPaths: { [filePath: string]: string } = {};

    constructor(
        private library: Library,
        private _libraryPath: string,
        private _hasher: IHasher,
        private _screenshotter: Screenshotter,
        private skipMetadataExtraction: boolean,
        private _configuration: LaputinConfiguration
    ) {
        super();
    }

    public load(performFullCheck: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const query = new Query(
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            );
            this.library.getFiles(query).then((existingFiles: File[]) => {
                this._existingFiles = _.keyBy(existingFiles, (f) => f.path);

                const walkerOptions = {
                    followLinks: false,
                    filters: ['.laputin'],
                };
                const walker = walk.walk(this._libraryPath, walkerOptions);
                walker.on('file', (root, walkStat, callback) => {
                    this.processFile(
                        root,
                        walkStat,
                        callback,
                        performFullCheck
                    );
                });
                walker.on('end', () => {
                    const missingFiles = _.values(this._existingFiles);
                    missingFiles.forEach((file) => {
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
        watch.createMonitor(
            this._libraryPath,
            { ignoreDotFiles: true },
            (monitor) => {
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
                monitor.on('removed', (removedPath: string) =>
                    this.removeFileFromPath(removedPath)
                );
            }
        );
    }

    private async processFile(
        root: string,
        walkStat: walk.WalkStat,
        next: () => void,
        performFullCheck: boolean
    ): Promise<void> {
        const filePath = path.normalize(path.join(root, walkStat.name));
        await this.addFileFromPath(filePath, walkStat, performFullCheck);
        next();
    }

    private async addFileFromPath(
        filePath: string,
        stats: fs.Stats,
        performFullCheck: boolean
    ): Promise<void> {
        if (stats.isDirectory()) {
            return;
        }
        if (this.fileShouldBeIgnored(filePath)) {
            return;
        }

        const escapedFilePath = filePath.replace(/\\/g, '/');
        if (
            !performFullCheck &&
            this._existingFiles[escapedFilePath] &&
            this._existingFiles[escapedFilePath].size === stats.size
        ) {
            const file = this._existingFiles[escapedFilePath];
            this.addFileToBookkeeping(file);

            winston.log(
                'verbose',
                'File found in same path with same size: ' + filePath
            );
        } else {
            const hash = await this._hasher.hash(filePath, stats);

            const buffer = readChunk.sync(filePath, 0, fileType.minimumBytes);
            const type = fileType(buffer);

            if (!type) {
                winston.log(
                    'warn',
                    `Could not read mime type from file ${filePath}. Skipping the file!`
                );
                return;
            }

            let metadata = {};
            if (!this.skipMetadataExtraction) {
                const ffprobeMetadata = await this.readFfprobeMetadata(
                    filePath
                );
                metadata = { ...metadata, ...ffprobeMetadata };

                const releaseDate = escapedFilePath.match(
                    /.*(\d\d\d\d-\d\d-\d\d).*/
                );
                if (releaseDate && releaseDate[1]) {
                    metadata = {
                        ...metadata,
                        releaseDate: releaseDate[1],
                    };
                } else {
                    const releaseYear = escapedFilePath.match(
                        /.* - (\d\d\d\d) - .*/
                    );
                    if (releaseYear && releaseYear[1]) {
                        metadata = {
                            ...metadata,
                            releaseDate: releaseYear[1],
                        };
                    }
                }

                metadata = {
                    ...metadata,
                    lastModified: stats.mtime,
                };
            }

            const file = new File(
                hash,
                filePath,
                [],
                stats.size,
                type.mime,
                metadata
            );
            this.addFileToBookkeeping(file);

            if (
                (type.mime.startsWith('video') ||
                    type.mime.startsWith('image')) &&
                !this._screenshotter.exists(file)
            ) {
                await this._screenshotter.screenshot(file, 180);
            }

            this.emit('found', file);

            winston.log('verbose', 'Found file: ' + filePath);
        }

        delete this._existingFiles[escapedFilePath];
    }

    private async readFfprobeMetadata(filePath: string): Promise<any> {
        const data = await probe(filePath);
        if (data && data.streams) {
            let isVideo = false;
            let isAudio = false;

            let primaryVideoStream;
            for (const stream of data.streams) {
                isVideo = isVideo || stream.codec_type === 'video';
                primaryVideoStream = stream;
                break;
            }

            if (isVideo) {
                return {
                    type: 'video',
                    codec: primaryVideoStream.codec_name,
                    width: primaryVideoStream.width,
                    height: primaryVideoStream.height,
                    duration: data.format.duration,
                    bitrate: data.format.bit_rate,
                    framerate: primaryVideoStream.avg_frame_rate,
                };
            }

            let primaryAudioStream;
            for (const stream of data.streams) {
                isAudio = isAudio || stream.codec_type === 'audio';
                primaryAudioStream = stream;
                break;
            }

            if (isAudio) {
                return {
                    type: 'audio',
                    codec: primaryAudioStream.codec_name,
                    duration: data.format.duration,
                    bitrate: data.format.bit_rate,
                };
            }
        }

        return {};
    }

    private addFileToBookkeeping(file: File): void {
        this.initializeListForHash(file);

        if (!this.identicalFileAlreadyExistsInIdenticalPath(file)) {
            this._files[file.hash].push(file);
            this._hashesByPaths[file.path] = file.hash;
        }
    }

    private fileShouldBeIgnored(filePath: string) {
        if (
            path.basename(filePath).startsWith('.') ||
            filePath.indexOf('Thumbs.db') !== -1
        ) {
            return true;
        }

        // This always returns extensions in a format such as ".txt"
        const extension = path
            .extname(filePath)
            .toLocaleLowerCase()
            .substring(1);

        return (
            this._configuration.ignoredExtensions &&
            this._configuration.ignoredExtensions.indexOf(extension) > -1
        );
    }

    private initializeListForHash(file: File): void {
        if (!this._files[file.hash]) {
            this._files[file.hash] = [];
        }
    }

    private identicalFileAlreadyExistsInIdenticalPath(file: File): boolean {
        const files = this._files[file.hash];
        return files.some(
            (fileForChecking: File): boolean =>
                file.path === fileForChecking.path
        );
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
            winston.log(
                'warn',
                `Tried to remove file ${filePath} but it was not found from file list via hash ${hash}!`
            );
        }
    }

    public getDuplicates(): any {
        const duplicates: any = {};

        _.forOwn(this._files, function (files: File[], hash: string) {
            if (files.length > 1) {
                duplicates[hash] = files;
            }
        });

        return duplicates;
    }
}
