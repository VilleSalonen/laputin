import express = require('express');
import bodyParser = require('body-parser');
import * as path from 'path';
import http = require('http');
import * as fs from 'fs';

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
import cors = require('cors');

export class Laputin {
    constructor(
        private _libraryPath: string,
        public library: Library,
        public fileLibrary: FileLibrary,
        private _opener: VLCOpener,
        private configuration: LaputinConfiguration
    ) {
        this.fileLibrary.on('found', (file: File) =>
            this.library.addFile(file)
        );
        this.fileLibrary.on('lost', (file: File) =>
            this.library.deactivateFile(file)
        );
    }

    public initializeRoutes(app: express.Express): void {
        app.use(bodyParser.json({}));

        app.use(cors({ origin: 'http://localhost:3000' }));

        const clientPath = path.join(__dirname, '../../../client/dist');
        app.use(express.static(clientPath));
        app.use(
            '/node_modules',
            <any>express.static(path.join(__dirname, '../node_modules'))
        );

        app.use('/api', this._createApiRoutes());

        app.get('/media/:fileId', async (req, res, next) => {
            if (!this.isInteger(req.params.fileId)) {
                return res
                    .status(400)
                    .send(
                        `Given fileId ${req.params.fileId} is not an integer!`
                    );
            }

            const file = await this.library.getFileById(
                parseInt(req.params.fileId)
            );
            if (!file) {
                return res.status(404);
            }

            var options = {
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
        });

        app.use(
            '/laputin',
            <any>express.static(path.join(this._libraryPath, '/public'))
        );

        if (this.configuration.proxyDirectory) {
            app.use(
                '/proxies',
                <any>express.static(this.configuration.proxyDirectory)
            );
        }
    }

    public async loadFiles(performFullCheck: boolean): Promise<void> {
        await this.fileLibrary.load(performFullCheck);
    }

    private _createApiRoutes(): express.Express {
        const api = express();

        api.route('/files').get(async (req, res) => {
            const files = await this.library.getFiles(<any>req.query);
            res.send(files);
        });

        api.route('/timecodes').get(async (req, res) => {
            const timecodes = await this.library.getTimecodes(<any>req.query);
            res.send(timecodes);
        });

        api.route('/tags').get(async (req, res) => {
            if (!req.query) {
                const tags = await this.library.getAllTags();
                res.send(tags);
            } else {
                var tagName = req.query.tagName || '';
                var andTags = this.parseTags(<any>req.query.andTags);
                var orTags = this.parseTags(<any>req.query.orTags);
                var notTags = this.parseTags(<any>req.query.notTags);
                var unassociated = req.query.unassociated === 'true';

                var query = new TagQuery(
                    <any>tagName,
                    <any>andTags,
                    <any>orTags,
                    <any>notTags,
                    <any>unassociated
                );

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
            const tag = await this.library.renameTag(
                Number(req.params.tagId),
                req.body.name
            );
            res.send(tag);
        });

        api.route('/files/:fileId/tags').post(async (req, res) => {
            if (!this.isInteger(req.params.fileId)) {
                return res
                    .status(400)
                    .send(
                        `Given fileId ${req.params.fileId} is not an integer!`
                    );
            }

            const file = await this.library.getFileById(
                parseInt(req.params.fileId)
            );
            if (!file) {
                return res.status(404);
            }

            const selectedTags = req.body.selectedTags;
            selectedTags.forEach((tag: Tag) => {
                this.library.createNewLinkBetweenTagAndFile(tag, file.hash);
            });
            res.status(200).end();
        });

        api.route('/files/:fileId/timecodes').get(async (req, res) => {
            if (!this.isInteger(req.params.fileId)) {
                return res
                    .status(400)
                    .send(
                        `Given fileId ${req.params.fileId} is not an integer!`
                    );
            }

            const file = await this.library.getFileById(
                parseInt(req.params.fileId)
            );
            if (!file) {
                return res.status(404);
            }

            const tags = await this.library.getTimecodesForFile(file.hash);
            res.send(tags);
        });

        api.route('/files/:fileId/timecodes').post(async (req, res) => {
            if (!this.isInteger(req.params.fileId)) {
                return res
                    .status(400)
                    .send(
                        `Given fileId ${req.params.fileId} is not an integer!`
                    );
            }

            const file = await this.library.getFileById(
                parseInt(req.params.fileId)
            );
            if (!file) {
                return res.status(404);
            }

            const timecode: Timecode = req.body.timecode;
            const screenshotTime: number = req.body.screenshotTime;

            timecode.timecodeTags.forEach((timecodeTag: TimecodeTag) => {
                this.library.createNewLinkBetweenTagAndFile(
                    timecodeTag.tag,
                    file.hash
                );
            });

            const result = await this.library.addTimecodeToFile(
                timecode,
                file.hash
            );

            if (!timecode.timecodeId) {
                const screenshotter = new Screenshotter(
                    this._libraryPath,
                    this.library
                );
                await screenshotter.screenshotTimecode(
                    file,
                    result,
                    screenshotTime
                );
            }

            res.send(result);
        });

        api.route('/files/:hash/timecodes/:timecodeId').put(
            async (req, res) => {
                await this.library.updateTimecodeStartAndEnd(
                    req.params.hash,
                    Number(req.params.timecodeId),
                    req.body.timecode
                );
                res.status(200).end();
            }
        );

        api.route(
            '/files/:hash/timecodes/:timecodeId/tags/:timecodeTagId'
        ).delete(async (req, res) => {
            await this.library.removeTagFromTimecode(
                req.params.hash,
                req.params.timecodeId,
                req.params.timecodeTagId
            );
            res.status(200).end();
        });

        api.route('/files/:hash/tags/:tagId').delete(async (req, res) => {
            await this.library.deleteLinkBetweenTagAndFile(
                Number(req.params.tagId),
                req.params.hash
            );
            res.status(200).end();
        });

        api.route('/files/:sourceHash/migrate/:targetHash').post(
            async (req, res) => {
                const sourceFile: File = await this.library.getFile(
                    req.params.sourceHash
                );
                const targetFile: File = await this.library.getFile(
                    req.params.targetHash
                );

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

        api.route('/open/files').get(async (req, res) => {
            const files = await this.library.getFiles(<any>req.query);
            this._opener.open(files);
            res.status(200).end();
        });

        api.route('/showInExplorer').get(async (req, res) => {
            const explorerOpener = new ExplorerOpener();

            const files = await this.library.getFiles(<any>req.query);
            if (files && files.length > 0) {
                explorerOpener.open(files);
            }
            res.status(200).end();
        });

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
                    const screenshotter = new Screenshotter(
                        this._libraryPath,
                        this.library
                    );
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
                    const screenshotter = new Screenshotter(
                        this._libraryPath,
                        this.library
                    );
                    await screenshotter.screenshotTimecode(
                        files[0],
                        req.body.timecode,
                        req.body.time
                    );
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
                    const screenshotter = new Screenshotter(
                        this._libraryPath,
                        this.library
                    );
                    await screenshotter.screenshotTag(
                        req.body.tag,
                        files[0],
                        req.body.time
                    );
                }

                res.status(200).end();
            } catch (error) {
                res.status(500).end();
            }
        });

        api.route('/proxyExists/:hash').get(async (req, res) => {
            if (!this.configuration.proxyDirectory) {
                res.send(false);
            } else {
                try {
                    fs.accessSync(
                        path.join(
                            this.configuration.proxyDirectory,
                            req.params.hash + '.mp4'
                        ),
                        fs.constants.R_OK
                    );
                    res.send(true);
                } catch (error) {
                    res.send(false);
                }
            }
        });

        return api;
    }

    private isInteger(candidate: string): boolean {
        return /^-?[0-9]+$/.test(candidate + '');
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
