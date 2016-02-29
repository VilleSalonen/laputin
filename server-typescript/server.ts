import Promise = require("bluebird");
import express = require("express");
import bodyParser = require("body-parser");
import path = require("path");
import _ = require("underscore");
import cors = require("cors");

import {Library} from "./library";
import {FileLibrary} from "./filelibrary";
import {Sha512Hasher} from "./sha512hasher";
import {File} from "./file";
import {Tag} from "./tag";

export class Laputin {
    public library: Library;
    public fileLibrary: FileLibrary;
    public app: express.Express;
    
    constructor(private _libraryPath: string) {
        this.library = new Library(this._libraryPath);
        this.fileLibrary = new FileLibrary(this._libraryPath, new Sha512Hasher());
        
        this.fileLibrary.on("found", (file: File) => this.library.addFile(file));
        this.fileLibrary.on("lost", (file: File) => this.library.deactivateFile(file));
    }
    
    public initializeRoutes(): void {
        this.app = express();

        this.app.use(cors());
        this.app.use(bodyParser.json({}));

        this.app.route("/files").get(async (req, res) => {
            let files = await this.library.getFiles(req.query);
            res.send(files);
        });

        this.app.route("/tags").get(async (req, res) => {
            let tags = await this.library.getTags(req.query);
            res.send(tags);
        });

        this.app.route("/tags").post(async (req, res) => {
            try {
                let tagName = req.body.tagName;
                let tag = await this.library.createNewTag(tagName);
                res.send(tag);
            }
            catch (error) {
                res.status(500).end();
            }
        });

        this.app.route("/files/:hash/tags").post((req, res) => {
            var selectedTags = req.body.selectedTags;
            _.each(selectedTags, (tag: Tag) => {
                this.library.createNewLinkBetweenTagAndFile(tag, req.params.hash);
            });
            res.status(200).end();
        });

        this.app.route("/files/:hash/tags/:tagId").delete(async (req, res) => {
            await this.library.deleteLinkBetweenTagAndFile(req.params.tagId, req.params.hash);
            res.status(200).end();
        });

        this.app.use("/media", express.static(this._libraryPath));
    }
    
    public async loadFiles(): Promise<void> {
        await this.library.deactivateAll();
        return this.fileLibrary.load();
    }
}
