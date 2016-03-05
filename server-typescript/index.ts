/// <reference path="typings/main.d.ts" />

import {Laputin} from "./server";
import fs = require("fs");
import path = require("path");

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

var configuration = {};
if (fs.existsSync(path.join(libraryPath, ".laputin.json"))) {
    configuration = JSON.parse(fs.readFileSync(path.join(libraryPath, ".laputin.json"), 'utf8'));
}

var laputin = new Laputin(libraryPath, configuration);

laputin.initializeRoutes();
console.time("hashing");
laputin.loadFiles()
    .then(() => {
        console.timeEnd("hashing");

        var port: number = configuration.port || 3200;

        laputin.app.listen(port, () => {
            console.log("Laputin started:");
            console.log("Port: " + port);
        });
    });