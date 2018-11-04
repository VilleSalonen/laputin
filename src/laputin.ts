import express = require('express');
import bodyParser = require('body-parser');
import path = require('path');
import http = require('http');
import fs = require('fs');

import {Library} from './library';
import {FileLibrary} from './filelibrary';
import {VLCOpener} from './vlcopener';
import {File} from './file';
import {Tag, Timecode} from './tag';
import { Screenshotter } from './screenshotter';
import { Query } from './query.model';

export class Laputin {
    public app: express.Express;
    private _server: http.Server;

    constructor(
        private _libraryPath: string,
        public library: Library,
        public fileLibrary: FileLibrary,
        private _opener: VLCOpener,
        private _port: number,
        private _proxyDirectory: string) {
        this.fileLibrary.on('found', (file: File) => this.library.addFile(file));
        this.fileLibrary.on('lost', (file: File) => this.library.deactivateFile(file));
    }

    public initializeRoutes(): void {
        this.app = express();

        this.app.use(bodyParser.json({}));

        this.app.use(express.static(path.join(__dirname, '../client/dist')));
        this.app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

        this.app.use('/api', this._createApiRoutes());
        this.app.use('/media', this._createMediaRoutes());

        this.app.use('/laputin', express.static(path.join(this._libraryPath, '/.laputin')));

        const mediaCatchAll = express();
        this.app.use('/media/', mediaCatchAll);

        if (this._proxyDirectory) {
            this.app.use('/proxies', express.static(this._proxyDirectory));
        }
    }

    public startListening(): Promise<void> {
        let done: Function;
        const promise = new Promise<void>((resolve, reject) => done = resolve);

        this._server = this.app.listen(this._port, done);

        return promise;
    }

    public stopListening(): Promise<void> {
        let done: Function;
        const promise = new Promise<void>((resolve, reject) => done = resolve);

        this._server.close(done);

        return promise;
    }

    public async loadFiles(performFullCheck: boolean): Promise<void> {
        return this.fileLibrary.load(performFullCheck);
    }

    public startMonitoring(): void {
        this.fileLibrary.startMonitoring();
    }

    private _createApiRoutes(): express.Express {
        const api = express();

        api.route('/files').get(async (req, res) => {
            const files = await this.library.getFiles(req.query);
            res.send(files);
        });

        api.route('/timecodes').get(async (req, res) => {
            const timecodes = await this.library.getTimecodes(req.query);
            res.send(timecodes);
        });

        api.route('/tags').get(async (req, res) => {
            const tags = await this.library.getTags(req.query);
            res.send(tags);
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
            const tag = await this.library.renameTag(req.params.tagId, req.body.name);
            res.send(tag);
        });

        api.route('/files/:hash/tags').post((req, res) => {
            const selectedTags = req.body.selectedTags;
            selectedTags.forEach((tag: Tag) => {
                this.library.createNewLinkBetweenTagAndFile(tag, req.params.hash);
            });
            res.status(200).end();
        });

        api.route('/files/:hash/timecodes').get(async (req, res) => {
            const tags = await this.library.getTimecodesForFile(req.params.hash);
            res.send(tags);
        });

        api.route('/files/:hash/timecodes').post(async (req, res) => {
            const timecode: Timecode = req.body.timecode;

            const query = new Query(undefined, undefined, req.params.hash, undefined, undefined, undefined, undefined);
            const files = await this.library.getFiles(query);

            if (files.length > 0) {
                const result = await this.library.addTimecodeToFile(
                    timecode,
                    req.params.hash);

                if (!timecode.timecodeId) {
                    const screenshotTime = timecode.start + (timecode.end - timecode.start) * 0.66;

                    const screenshotter = new Screenshotter(this._libraryPath, this.library);
                    await screenshotter.screenshotTimecode(files[0], result, screenshotTime);
                }

                res.send(result);
            } else {
                console.log('no files found');
                res.send(500);
            }
        });

        api.route('/files/:hash/timecodes/:timecodeId').put(async (req, res) => {
            await this.library.updateTimecodeStartAndEnd(req.params.hash, req.params.timecodeId, req.body.timecode);
            res.status(200).end();
        });

        api.route('/files/:hash/timecodes/:timecodeId/tags/:timecodeTagId').delete(async (req, res) => {
            const result = await this.library.removeTagFromTimecode(req.params.hash, req.params.timecodeId, req.params.timecodeTagId);
            res.status(200).end();
        });

        api.route('/files/:hash/tags/:tagId').delete(async (req, res) => {
            await this.library.deleteLinkBetweenTagAndFile(req.params.tagId, req.params.hash);
            res.status(200).end();
        });

        api.route('/duplicates').get((req, res) => {
            res.send(this.fileLibrary.getDuplicates());
        });

        api.route('/open/files').get(async (req, res) => {
            const files = await this.library.getFiles(req.query);
            this._opener.open(files);
            res.status(200).end();
        });

        api.route('/screenshot').post(async (req, res) => {
            try {
                const query = new Query(undefined, undefined, req.body.hash, undefined, undefined, undefined, undefined);
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
                const query = new Query(undefined, undefined, req.body.hash, undefined, undefined, undefined, undefined);
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
                const query = new Query(undefined, undefined, req.body.hash, undefined, undefined, undefined, undefined);
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

        api.route('/proxyExists/:hash').get(async (req, res) => {
            if (!(this._proxyDirectory)) {
                res.send(false);
            } else {
                try {
                    fs.accessSync(path.join(this._proxyDirectory, req.params.hash + '.mp4'), fs.constants.R_OK);
                    res.send(true);
                } catch (error) {
                    res.send(false);
                }
            }
        });

        return api;
    }

    private _createMediaRoutes(): express.Express {
        let previous: express.Express = null;
        const components = this._libraryPath.split('\\');
        for (let i = components.length; i > 0; i--) {
            const currentPath = components[i - 1];
            const current: express.Express = express();

            if (i === components.length) {
                current.use('/' + currentPath, express.static(this._libraryPath));
            } else {
                current.use('/' + currentPath, previous);
            }

            previous = current;
        }

        return previous;
    }
}
