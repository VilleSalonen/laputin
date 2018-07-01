import express = require('express');
import bodyParser = require('body-parser');
import path = require('path');
import http = require('http');
import _ = require('lodash');
import cors = require('cors');

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
        private _libraryPath: string, public library: Library, public fileLibrary: FileLibrary,
        private _opener: VLCOpener, private _port: number) {
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

    public async loadFiles(): Promise<void> {
        await this.library.deactivateAll();
        return this.fileLibrary.load();
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
            _.each(selectedTags, (tag: Tag) => {
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

            const result = await this.library.addTimecodeToTagAssociation(
                new Tag(timecode.timecodeTags[0].tag.id, timecode.timecodeTags[0].tag.name, 0),
                req.params.hash,
                timecode.start,
                timecode.end);

            const query = new Query(undefined, undefined, req.params.hash, undefined, undefined, undefined);
            const files = await this.library.getFiles(query);

            if (files.length > 0) {
                const screenshotTime = timecode.start + (timecode.end - timecode.start) * 0.66;

                const screenshotter = new Screenshotter(this._libraryPath);
                await screenshotter.screenshotTagTimecode(files[0], result, screenshotTime);
            }

            res.send(result);
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
            await this._opener.open(files);
            res.status(200).end();
        });

        api.route('/screenshot').post(async (req, res) => {
            try {
                const query = new Query(undefined, undefined, req.body.hash, undefined, undefined, undefined);
                const files = await this.library.getFiles(query);

                if (files.length > 0) {
                    const screenshotter = new Screenshotter(this._libraryPath);
                    await screenshotter.screenshot(files[0], req.body.time);
                }

                res.status(200).end();
            } catch (error) {
                res.status(500).end();
            }
        });

        api.route('/screenshotTagTimecode').post(async (req, res) => {
            try {
                const query = new Query(undefined, undefined, req.body.hash, undefined, undefined, undefined);
                const files = await this.library.getFiles(query);

                if (files.length > 0) {
                    const screenshotter = new Screenshotter(this._libraryPath);
                    await screenshotter.screenshotTagTimecode(files[0], req.body.timecode, req.body.time);
                }

                res.status(200).end();
            } catch (error) {
                res.status(500).end();
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
