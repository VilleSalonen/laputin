/// <reference path="typings/tsd.d.ts" />

import express = require("express");
import bodyParser = require("body-parser");
import path = require("path");
import _ = require("underscore");
import cors = require("cors");

import {Library} from "./library";
import {File} from "./file";

var libraryPath: string = "test-archive-no-commit";
var library = new Library(libraryPath);

var app: express.Express = express();

app.use(cors());
app.use(bodyParser.json({}));

app.route("/files").get(function (req, res) {
    library.getFiles(req.query, function (files: File[]): void {
        res.send(files);
    });
});

app.route("/tags").get(function (req, res) {
    library.getTags(req.query, function (tags) {
        res.send(_.values(tags));
    });
});

app.route("/tags").post(function (req, res) {
    var tagName = req.body.tagName;
    library.createNewTag(tagName, function (err, tag) {
        if (err)
            res.status(500).send(err);
        else
            res.status(200).send(tag);
    });
});

app.route("/files/:hash/tags").post(function (req, res) {
    var selectedTags = req.body.selectedTags;
    _.each(selectedTags, function (tag) {
        library.createNewLinkBetweenTagAndFile(tag, req.params.hash);
    });
    res.status(200).end();
});

app.use("/media", express.static(libraryPath));

var port: number = +process.env.PORT || 3200;

var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});