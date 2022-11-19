import express = require('express');
import bodyParser = require('body-parser');
import path = require('path');
import { constants } from 'node:fs';
import fs = require('fs/promises');
import { param } from 'express-validator';
import cors = require('cors');
import http = require('http');

import { Library } from './library';
import { FileLibrary } from './filelibrary';
import { VLCOpener } from './vlcopener';
import { File } from './file';
import { Tag, Timecode, TimecodeTag } from './tag';
import { Screenshotter } from './screenshotter';
import { Query } from './query.model';
import { ExplorerOpener } from './exploreropener';
import { FileDataMigrator } from './filedatamigrator';
import { SceneDetector } from './scenedetector';
import { TagQuery } from './tagquery.model';
import { LaputinConfiguration } from './laputinconfiguration';

export class Laputin {
    public app: express.Express | undefined = undefined;
    private server: http.Server | undefined = undefined;

    constructor(
        private _libraryPath: string,
        public library: Library,
        public fileLibrary: FileLibrary,
        private _opener: VLCOpener,
        private configuration: LaputinConfiguration
    ) {}

    public initializeRoutes(app: express.Express): void {
        this.app = app;

        this.app.use(bodyParser.json({}));

        this.app.use(cors({ origin: 'http://localhost:3000' }));

        const clientPath = path.join(__dirname, '../../../client/dist');
        this.app.use(express.static(clientPath));
        this.app.use('/node_modules', <any>express.static(path.join(__dirname, '../node_modules')));

        this.app.use('/api', this._createApiRoutes());

        this.app.get(
            '/media/:fileId',
            param('fileId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const file = this.getFileFromReq(req);

                const options = {
                    root: path.parse(file.path).dir,
                    dotfiles: 'deny',
                    headers: {
                        'x-timestamp': Date.now(),
                        'x-sent': true,
                    },
                };

                res.sendFile(path.parse(file.path).base, options, () => {
                    // Error logging suppressed intentionally. These are typically really verbose such as logging that request was aborted.
                });
            }
        );

        this.app.use('/laputin', <any>express.static(path.join(this._libraryPath, '/public')));

        if (this.configuration.proxyDirectory) {
            this.app.use('/proxies', <any>express.static(this.configuration.proxyDirectory));
        }
    }

    public async loadFiles(performFullCheck: boolean): Promise<void> {
        await this.fileLibrary.load(performFullCheck);
    }

    public startListening(port: number, callback?: () => void): http.Server {
        if (!this.app) {
            throw new Error('Express is not initialized!');
        }

        this.server = this.app.listen(port, callback);
        return this.server;
    }

    public stopListening() {
        this.server?.close();
    }

    private async validateFileExists(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): Promise<void> {
        const fileId: number = (<any>req.params).fileId;

        const file = await this.library.getFileById(fileId);
        if (!file) {
            res.status(404).send(`Could not find file with ${fileId}`);
        } else {
            (<any>req).file = file;
            next();
        }
    }

    private getFileFromReq(req: express.Request): File {
        const file: File = (<any>req).file;
        if (!file) {
            throw new Error('Could not read file from req! Did you run middleware validateFileExists?');
        }

        return file;
    }

    private _createApiRoutes(): express.Express {
        const api = express();

        api.route('/files').get(async (req, res) => {
            const files = await this.library.getFiles(<any>req.query);
            res.send(files);
        });

        api.get(
            '/files/:fileId',
            param('fileId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const file = await this.library.getFileById(parseInt(req.params.fileId));
                if (file) {
                    res.send(file);
                } else {
                    res.status(404);
                }
            }
        );

        api.route('/timecodes').get(async (req, res) => {
            const timecodes = await this.library.getTimecodes(<any>req.query);
            res.send(timecodes);
        });

        api.route('/tags').get(async (req, res) => {
            if (!req.query) {
                const tags = await this.library.getAllTags();
                res.send(tags);
            } else {
                const tagName = req.query.tagName || '';
                const andTags = this.parseTags(<any>req.query.andTags);
                const orTags = this.parseTags(<any>req.query.orTags);
                const notTags = this.parseTags(<any>req.query.notTags);
                const unassociated = req.query.unassociated === 'true';

                const query = new TagQuery(<any>tagName, <any>andTags, <any>orTags, <any>notTags, <any>unassociated);

                const tags = await this.library.getTags(query);
                res.send(tags);
            }
        });

        api.route('/tags').post(async (req, res) => {
            try {
                const tagName = req.body.tagName;
                const tag = await this.library.createNewTag(tagName);
                res.send(tag);
            } catch (error) {
                res.status(500).end();
            }
        });

        api.route('/tags/:tagId').put(async (req, res) => {
            const tag = await this.library.renameTag(Number(req.params.tagId), req.body.name);
            res.send(tag);
        });

        api.post(
            '/files/:fileId/tags',
            param('fileId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const file = this.getFileFromReq(req);

                const selectedTags = req.body.selectedTags;
                selectedTags.forEach((tag: Tag) => {
                    this.library.createNewLinkBetweenTagAndFile(tag, file.hash);
                });
                res.status(200).end();
            }
        );

        api.get(
            '/files/:fileId/timecodes',
            param('fileId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const file = this.getFileFromReq(req);

                const tags = await this.library.getTimecodesForFile(file);
                res.send(tags);
            }
        );

        api.post(
            '/files/:fileId/timecodes',
            param('fileId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const file = this.getFileFromReq(req);

                const timecode: Timecode = req.body.timecode;
                const screenshotTime: number = req.body.screenshotTime;

                timecode.timecodeTags.forEach((timecodeTag: TimecodeTag) => {
                    this.library.createNewLinkBetweenTagAndFile(timecodeTag.tag, file.hash);
                });

                const result = await this.library.addTimecodeToFile(timecode, file.hash);

                if (!timecode.timecodeId) {
                    const screenshotter = new Screenshotter(this._libraryPath, this.library);
                    await screenshotter.screenshotTimecode(file, result, screenshotTime);
                }

                res.send(result);
            }
        );

        api.put(
            '/files/:fileId/timecodes/:timecodeId',
            param('fileId').exists().toInt(),
            param('timecodeId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                await this.library.updateTimecodeStartAndEnd(Number(req.params?.timecodeId), req.body.timecode);
                res.status(200).end();
            }
        );

        api.delete(
            '/files/:fileId/timecodes/:timecodeId/tags/:timecodeTagId',
            param('fileId').exists().toInt(),
            param('timecodeId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const file = this.getFileFromReq(req);

                await this.library.removeTagFromTimecode(file.hash, req.params.timecodeId, req.params.timecodeTagId);
                res.status(200).end();
            }
        );

        api.delete(
            '/files/:fileId/tags/:tagId',
            param('fileId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const file = this.getFileFromReq(req);

                await this.library.deleteLinkBetweenTagAndFile(Number(req.params.tagId), file.hash);
                res.status(200).end();
            }
        );

        api.post(
            '/files/:sourceFileId/migrate/:targetFileId',
            param('sourceFileId').exists().toInt(),
            param('targetFileId').exists().toInt(),
            async (req, res) => {
                const sourceFile = await this.library.getFileById(req.params?.sourceFileId);
                if (!sourceFile) {
                    res.status(404).send(`Could not find source file with ID ${req.params?.sourceFileId}`);
                    return;
                }

                const targetFile = await this.library.getFileById(req.params?.targetFileId);
                if (!targetFile) {
                    res.status(404).send(`Could not find target file with ID ${req.params?.sourceFileId}`);
                    return;
                }

                const fileDataMigrator = new FileDataMigrator(
                    this.library,
                    new Screenshotter(this._libraryPath, this.library),
                    new SceneDetector(this._libraryPath, this.library)
                );
                await fileDataMigrator.migrateAllData(sourceFile, targetFile);

                res.status(200).end();
            }
        );

        api.route('/duplicates').get((req, res) => {
            res.send(this.fileLibrary.getDuplicates());
        });

        api.post(
            '/open/files/:fileId',
            param('fileId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const file = await this.library.getFileById(parseInt(req.params.fileId));
                if (!file) {
                    res.status(404).end();
                } else {
                    this._opener.open([file]);
                    res.status(200).end();
                }
            }
        );

        api.route('/open/files').get(async (req, res) => {
            const files = await this.library.getFiles(<any>req.query);
            this._opener.open(files);
            res.status(200).end();
        });

        api.post(
            '/showInExplorer/:fileId',
            param('fileId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const explorerOpener = new ExplorerOpener();

                const file = await this.library.getFileById(parseInt(req.params.fileId));
                if (!file) {
                    res.status(404).end();
                } else {
                    explorerOpener.open(file);
                    res.status(200).end();
                }
            }
        );

        api.route('/screenshot').post(async (req, res) => {
            try {
                const query = new Query(
                    undefined,
                    undefined,
                    undefined,
                    [req.body.hash],
                    undefined,
                    undefined,
                    undefined,
                    undefined
                );
                const files = await this.library.getFiles(query);

                if (files.length > 0) {
                    const screenshotter = new Screenshotter(this._libraryPath, this.library);
                    await screenshotter.screenshot(files[0], req.body.time);
                }

                res.status(200).end();
            } catch (error) {
                res.status(500).end();
            }
        });

        api.route('/screenshotTimecode').post(async (req, res) => {
            try {
                const query = new Query(
                    undefined,
                    undefined,
                    undefined,
                    [req.body.hash],
                    undefined,
                    undefined,
                    undefined,
                    undefined
                );
                const files = await this.library.getFiles(query);

                if (files.length > 0) {
                    const screenshotter = new Screenshotter(this._libraryPath, this.library);
                    await screenshotter.screenshotTimecode(files[0], req.body.timecode, req.body.time);
                }

                res.status(200).end();
            } catch (error) {
                res.status(500).end();
            }
        });

        api.route('/screenshotTag').post(async (req, res) => {
            try {
                const query = new Query(
                    undefined,
                    undefined,
                    undefined,
                    [req.body.hash],
                    undefined,
                    undefined,
                    undefined,
                    undefined
                );
                const files = await this.library.getFiles(query);

                if (files.length > 0) {
                    const screenshotter = new Screenshotter(this._libraryPath, this.library);
                    await screenshotter.screenshotTag(req.body.tag, files[0], req.body.time);
                }

                res.status(200).end();
            } catch (error) {
                res.status(500).end();
            }
        });

        api.get(
            '/proxyExists/:fileId',
            param('fileId').exists().toInt(),
            (req: express.Request, res: express.Response, next: express.NextFunction) =>
                this.validateFileExists(req, res, next),
            async (req, res) => {
                const file = this.getFileFromReq(req);

                if (!this.configuration.proxyDirectory) {
                    res.send(false);
                } else {
                    try {
                        await fs.access(
                            path.join(this.configuration.proxyDirectory, file.fileId + '.mp4'),
                            constants.R_OK
                        );
                        res.send(true);
                    } catch (error) {
                        res.send(false);
                    }
                }
            }
        );

        return api;
    }

    private parseTags(tagsString: string): string[] {
        if (!tagsString) {
            return [];
        }

        if (tagsString.indexOf(',') === -1) {
            return [tagsString];
        }

        return tagsString.split(',');
    }
}
