import express = require("express");
import bodyParser = require("body-parser");
import path = require("path");
import _ = require("underscore");
import cors = require("cors");

import {Library} from "./library";
import {File} from "./file";
import {Tag} from "./tag";

var libraryPath: string = "test-archive-no-commit";
var library = new Library(libraryPath);

var app: express.Express = express();

app.use(cors());
app.use(bodyParser.json({}));

app.route("/files").get((req, res) => {
    library.getFiles(req.query, (files: File[]) => {
        res.send(files);
    });
});

app.route("/tags").get((req, res) => {
    library.getTags(req.query, (tags: Tag[]) => {
        res.send(tags);
    });
});

app.route("/tags").post((req, res) => {
    var tagName = req.body.tagName;
    library.createNewTag(tagName, (err, tag) => {
        if (err)
            res.status(500).send(err);
        else
            res.status(200).send(tag);
    });
});

app.route("/files/:hash/tags").post((req, res) => {
    var selectedTags = req.body.selectedTags;
    _.each(selectedTags, (tag: Tag) => {
        library.createNewLinkBetweenTagAndFile(tag, req.params.hash);
    });
    res.status(200).end();
});

app.use("/media", express.static(libraryPath));

export var server = app;
export var lib = library;
