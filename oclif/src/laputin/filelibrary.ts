import _ = require('lodash');
import * as path from 'path';
import watch = require('watch');
import events = require('events');
import winston = require('winston');

import { Stats } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';

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
    private _existingFilesByPath: Map<string, File> = new Map<string, File>();

    private _files: { [hash: string]: File[] } = {};
    private _hashesByPaths: { [filePath: string]: string } = {};

    constructor(
        private library: Library,
        private _hasher: IHasher,
        private _screenshotter: Screenshotter,
        private skipMetadataExtraction: boolean,
        private _configuration: LaputinConfiguration
    ) {
        super();
    }

    public async load(performFullCheck: boolean): Promise<void> {
        const query = new Query(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            performFullCheck
        );

        const existingFiles = await this.library.getFiles(query);
        const existingFilesByHash = new Map<string, File>();
        for (const existingFile of existingFiles) {
            this._existingFilesByPath.set(existingFile.path, existingFile);
            existingFilesByHash.set(existingFile.hash, existingFile);
        }

        const actualFilesByHash = new Map<string, File>();
        for (const mediaPath of this._configuration.mediaPaths) {
            const filePaths = await this.readdirRecursive(mediaPath);

            for (const filePath of filePaths) {
                const fileStats = await stat(filePath);
                const file = await this.addFileFromPath(
                    filePath,
                    fileStats,
                    performFullCheck
                );
                if (file) {
                    actualFilesByHash.set(file.hash, file);
                }
            }
        }

        const existingHashSet = new Set(existingFilesByHash.keys());
        const actualHashSet = new Set(actualFilesByHash.keys());
        const missingHashSet = new Set(
            [...existingHashSet].filter(
                (element) => !actualHashSet.has(element)
            )
        );
        for (const missingHash of missingHashSet) {
            const missingFile = existingFilesByHash.get(missingHash);
            if (missingFile) {
                this.library.deactivateFile(missingFile);
            }
        }

        this.startMonitoring();
    }

    private async readdirRecursive(directory: string): Promise<string[]> {
        let files: string[] = [];
        const items = await readdir(directory, { withFileTypes: true });

        for (const item of items) {
            if (item.isDirectory()) {
                const directoryPath = path.join(directory, item.name);
                const directoryFiles = await this.readdirRecursive(
                    directoryPath
                );
                files = [...files, ...directoryFiles];
            } else {
                const filePath = path.join(directory, item.name);
                const normalizedFilePath = path.normalize(filePath);
                files.push(normalizedFilePath);
            }
        }

        return files.sort();
    }

    public close(): void {
        for (const mediaPath of this._configuration.mediaPaths) {
            watch.unwatchTree(mediaPath);
        }
    }

    private startMonitoring(): void {
        const monitorCallback = (monitor: watch.Monitor) => {
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
                try {
                    const stats = await stat(createdPath);
                    this.addFileFromPath(createdPath, stats, false);
                } catch (e) {
                    winston.log('debug', 'Error with created file: ' + e);
                }
            });
            monitor.on('changed', async (changedPath: string) => {
                try {
                    const stats = await stat(changedPath);
                    this.addFileFromPath(changedPath, stats, false);
                } catch (e) {
                    winston.log('debug', 'Error with changed file: ' + e);
                }
            });
            monitor.on('removed', (removedPath: string) =>
                this.removeFileFromPath(removedPath)
            );
        };

        // Start monitoring after library has been hashed. Otherwise changes
        // done to database file cause changed events to be emitted and thus
        // slow down the initial processing.
        for (const mediaPath of this._configuration.mediaPaths) {
            watch.createMonitor(
                mediaPath,
                { ignoreDotFiles: true },
                monitorCallback
            );
        }
    }

    private async addFileFromPath(
        filePath: string,
        stats: Stats,
        performFullCheck: boolean
    ): Promise<File | null> {
        try {
            if (stats.isDirectory()) {
                return null;
            }
            if (this.fileShouldBeIgnored(filePath)) {
                return null;
            }

            const normalizedFilePath = path.normalize(filePath);
            const existingFile = this._existingFilesByPath.get(
                normalizedFilePath
            );
            if (
                !performFullCheck &&
                existingFile &&
                BigInt(existingFile.size) === BigInt(stats.size)
            ) {
                this.addFileToBookkeeping(existingFile);

                winston.log(
                    'verbose',
                    'File found in same path with same size: ' + filePath
                );

                return existingFile;
            } else {
                const hash = await this._hasher.hash(filePath, stats);

                const buffer = readChunk.sync(
                    filePath,
                    0,
                    fileType.minimumBytes
                );
                const type = fileType(buffer);

                if (!type) {
                    winston.log(
                        'warn',
                        `Could not read mime type from file ${filePath}. Skipping the file!`
                    );
                    return null;
                }

                let metadata = {};
                if (!this.skipMetadataExtraction) {
                    const ffprobeMetadata = await this.readFfprobeMetadata(
                        filePath
                    );
                    metadata = { ...metadata, ...ffprobeMetadata };

                    const releaseDate = normalizedFilePath.match(
                        /.*(\d\d\d\d-\d\d-\d\d).*/
                    );
                    if (releaseDate && releaseDate[1]) {
                        metadata = {
                            ...metadata,
                            releaseDate: releaseDate[1],
                        };
                    } else {
                        const releaseYear = normalizedFilePath.match(
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
                    NaN,
                    hash,
                    filePath,
                    [],
                    stats.size,
                    type.mime,
                    metadata
                );
                this.addFileToBookkeeping(file);

                const fileFromDb = await this.library.addFile(file);

                if (
                    fileFromDb &&
                    (type.mime.startsWith('video') ||
                        type.mime.startsWith('image')) &&
                    !this._screenshotter.exists(fileFromDb)
                ) {
                    await this._screenshotter.screenshot(fileFromDb, 180);
                }

                winston.log('verbose', 'Found file: ' + filePath);

                return fileFromDb;
            }
        } catch (err) {
            // console.log('err', err);
        }

        return null;
    }

    private async readFfprobeMetadata(filePath: string): Promise<any> {
        const data = await probe(filePath);
        if (data && data.streams) {
            let primaryVideoStream;
            for (const stream of data.streams) {
                if (stream.codec_type === 'video') {
                    primaryVideoStream = stream;
                    break;
                }
            }

            if (primaryVideoStream) {
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
                if (stream.codec_type === 'audio') {
                    primaryAudioStream = stream;
                    break;
                }
            }

            if (primaryAudioStream) {
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
        const hash = this._hashesByPaths[filePath];
        const files = this._files[hash];

        if (!files) {
            return;
        }

        const file = files.find((f: File) => {
            return f.path === filePath;
        });

        if (file) {
            this._files[hash] = files.filter((f: File) => {
                return f.path !== filePath;
            });

            this.library.deactivateFile(file);

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
        const hashes = Object.keys(this._files);

        for (const hash of hashes) {
            const files = this._files[hash];
            if (files.length > 1) {
                duplicates[hash] = files;
            }
        }

        return duplicates;
    }
}
