/// <reference path="typings/main.d.ts" />

import fs = require("fs");
import path = require("path");

import {Laputin} from "./server";
import {LaputinConfiguration} from "./laputinconfiguration";

var libraryPath = "";
if (process.argv.length === 2) {
    console.log("Defaulting to current directory...");
    libraryPath = process.cwd() + "";
} else if (process.argv.length !== 3) {
    console.log("You have to pass library path as an argument.");
    process.exit(-1);
} else {
    libraryPath = process.argv.splice(2)[0];
}

console.log("Library path: " + libraryPath);

if (!fs.existsSync(libraryPath) || !fs.statSync(libraryPath).isDirectory()) {
    console.log(libraryPath + " is not a valid directory.");
    process.exit(-2);
}

var configuration: LaputinConfiguration;
if (fs.existsSync(path.join(libraryPath, ".laputin.json"))) {
    configuration = JSON.parse(fs.readFileSync(path.join(libraryPath, ".laputin.json"), 'utf8'));
} else {
    configuration = new LaputinConfiguration(3200);
}

var laputin = new Laputin(libraryPath, configuration);

laputin.initializeRoutes();
console.time("hashing");
laputin.loadFiles()
    .then(() => {
        console.timeEnd("hashing");

        laputin.app.listen(configuration.port, () => {
            console.log("Laputin started:");
            console.log("Port: " + configuration.port);
        });
    });