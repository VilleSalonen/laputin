import Promise = require("bluebird");
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

        this.app.use(express.static(path.join(__dirname, "../client")));
        this.app.use("/node_modules", express.static(path.join(__dirname, "../node_modules")));
        this.app.use("/media", express.static(this._libraryPath));

        this.app.route("/api/files").get(async (req, res) => {
            let files = await this.library.getFiles(req.query);
            res.send(files);
        });

        this.app.route("/api/tags").get(async (req, res) => {
            let tags = await this.library.getTags(req.query);
            res.send(tags);
        });

        this.app.route("/api/tags").post(async (req, res) => {
            try {
                let tagName = req.body.tagName;
                let tag = await this.library.createNewTag(tagName);
                res.send(tag);
            }
            catch (error) {
                res.status(500).end();
            }
        });

        this.app.route("/api/files/:hash/tags").post((req, res) => {
            var selectedTags = req.body.selectedTags;
            _.each(selectedTags, (tag: Tag) => {
                this.library.createNewLinkBetweenTagAndFile(tag, req.params.hash);
            });
            res.status(200).end();
        });

        this.app.route("/api/files/:hash/tags/:tagId").delete(async (req, res) => {
            await this.library.deleteLinkBetweenTagAndFile(req.params.tagId, req.params.hash);
            res.status(200).end();
        });
        
        this.app.route("/api/duplicates").get((req, res) => {
            res.send(this.fileLibrary.getDuplicates());
        });
        
        this.app.route("/api/open/files").get(async (req, res) => {
            let files = await this.library.getFiles(req.query);
            await this._opener.open(files);
            res.status(200).end();
        });
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
}
