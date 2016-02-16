import express = require("express");
import path = require("path");
import _ = require("underscore");
import cors = require("cors");

import {Library} from "./library";

var libraryPath: string = "test-archive-no-commit";
var library = new Library(libraryPath);

var app: express.Express = express();

app.use(cors());

app.get('/', (req, res) => {
    res.send('Testing 1 2 3');
});

app.route("/files").get(function (req, res) {
    library.getFiles(req.query, function (files) {
        res.send(_.values(files));
    });
});

app.route("/tags").get(function (req, res) {
    res.send([]);
});


app.use("/media", express.static(libraryPath));

var port: number = +process.env.PORT || 3200;

var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});