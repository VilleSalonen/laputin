import express = require("express");
import bodyParser = require("body-parser");
import path = require("path");
import http = require("http");
import _ = require("lodash");
import cors = require("cors");

import {Library} from "./library";
import {FileLibrary} from "./filelibrary";
import {VLCOpener} from "./vlcopener";
import {File} from "./file";
import {Tag} from "./tag";

export class Laputin {
    public app: express.Express;
    private _server: http.Server;

    constructor(private _libraryPath: string, public library: Library, public fileLibrary: FileLibrary, private _opener: VLCOpener, private _port: number) {
        this.fileLibrary.on("found", (file: File) => this.library.addFile(file));
        this.fileLibrary.on("lost", (file: File) => this.library.deactivateFile(file));
    }

    public initializeRoutes(): void {
        this.app = express();

        this.app.use(bodyParser.json({}));

        this.app.use(express.static(path.join(__dirname, "../client/dist")));
        this.app.use("/node_modules", express.static(path.join(__dirname, "../node_modules")));

        this.app.use("/api", this._createApiRoutes());
        this.app.use("/media", this._createMediaRoutes());

        var mediaCatchAll = express();
        this.app.use("/media/", mediaCatchAll);
    }

    public startListening(): Promise<void> {
        var done: Function;
        var promise = new Promise<void>((resolve, reject) => done = resolve);
        
        this._server = this.app.listen(this._port, done);
        
        return promise;
    }
    
    public stopListening(): Promise<void> {
        var done: Function;
        var promise = new Promise<void>((resolve, reject) => done = resolve);
        
        this._server.close(done);
        
        return promise;
    }

    public async loadFiles(): Promise<void> {
        await this.library.deactivateAll();
        return this.fileLibrary.load();
    }

    private _createApiRoutes(): express.Express {
        var api = express();

        api.route("/files").get(async (req, res) => {
            let files = await this.library.getFiles(req.query);
            res.send(files);
        });

        api.route("/tags").get(async (req, res) => {
            let tags = await this.library.getTags(req.query);
            res.send(tags);
        });

        api.route("/tags").post(async (req, res) => {
            try {
                let tagName = req.body.tagName;
                let tag = await this.library.createNewTag(tagName);
                res.send(tag);
            }
            catch (error) {
                res.status(500).end();
            }
        });

        api.route("/tags/:tagId").put(async (req, res) => {
            let tag = await this.library.renameTag(req.params.tagId, req.body.name);
            res.send(tag);
        });

        api.route("/files/:hash/tags").post((req, res) => {
            var selectedTags = req.body.selectedTags;
            _.each(selectedTags, (tag: Tag) => {
                this.library.createNewLinkBetweenTagAndFile(tag, req.params.hash);
            });
            res.status(200).end();
        });

        api.route("/files/:hash/tags/:tagId").delete(async (req, res) => {
            await this.library.deleteLinkBetweenTagAndFile(req.params.tagId, req.params.hash);
            res.status(200).end();
        });
        
        api.route("/duplicates").get((req, res) => {
            res.send(this.fileLibrary.getDuplicates());
        });
        
        api.route("/open/files").get(async (req, res) => {
            let files = await this.library.getFiles(req.query);
            await this._opener.open(files);
            res.status(200).end();
        });

        return api;
    }

    private _createMediaRoutes(): express.Express {
        var previous: express.Express = null;
        var components = this._libraryPath.split("\\");
        for (var i = components.length; i > 0; i--) {
            var currentPath = components[i - 1];
            var current: express.Express = express();

            if (i == components.length) {
                current.use("/" + currentPath, express.static(this._libraryPath));
            } else {
                current.use("/" + currentPath, previous);
            }

            previous = current;
        }

        return previous;
    }
}
