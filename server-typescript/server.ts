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
        this.fileLibrary = new FileLibrary(this._libraryPath, new Sha512Hasher(), this.library);
    }
    
    public initializeRoutes(): void {
        this.app = express();

        this.app.use(cors());
        this.app.use(bodyParser.json({}));

        this.app.route("/files").get((req, res) => {
            this.library.getFiles(req.query)
                .then((files) => { res.send(files); });
        });

        this.app.route("/tags").get((req, res) => {
            this.library.getTags(req.query)
                .then((tags) => { res.send(tags); });
        });

        this.app.route("/tags").post((req, res) => {
            var tagName = req.body.tagName;
            this.library.createNewTag(tagName)
                .then((tag) => { res.send(tag); })
                .catch(() => res.status(500).end());
        });

        this.app.route("/files/:hash/tags").post((req, res) => {
            var selectedTags = req.body.selectedTags;
            _.each(selectedTags, (tag: Tag) => {
                this.library.createNewLinkBetweenTagAndFile(tag, req.params.hash);
            });
            res.status(200).end();
        });

        this.app.route("/files/:hash/tags/:tagId").delete((req, res) => {
            this.library.deleteLinkBetweenTagAndFile(req.params.tagId, req.params.hash)
                .then(() => { res.status(200).end(); });
        });

        this.app.use("/media", express.static(this._libraryPath));
    }
    
    public loadFiles(): void {
        //this.library.createTables();
        this.library.deactivateAll().then(() => {
            this.fileLibrary.load(() => {});
        });
    }
}
