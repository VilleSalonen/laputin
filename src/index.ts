/// <reference path="command-line-args.d.ts" />

import commandLineArgs = require("command-line-args");
import commandLineUsage = require("command-line-usage");
import fs = require("fs");
import path = require("path");
import winston = require("winston");

import {Laputin} from "./laputin";
import {Library} from "./library";
import {LaputinConfiguration} from "./laputinconfiguration";
import {compose} from "./compose";

(async function() {
    let argumentDefinitions = [
        { name: "libraryPath", type: String, multiple: false, defaultOption: true },
        { name: "initialize", type: Boolean, multiple: false },
        { name: "verbose", type: Boolean, multiple: false },
        { name: "bypassHashing", type: Boolean, multiple: false }
    ];
    const usage = commandLineUsage(argumentDefinitions);

    let options: any = commandLineArgs(argumentDefinitions);

    // For some reason " is added only to the end of the path if path contains spaces.
    options.libraryPath = options.libraryPath.replace(/\"/g, '');

    if (options.verbose) {
        winston.level = "verbose";
    }

    if (!options.libraryPath) {
        console.log("You have to pass library path as an argument.");
        console.log(usage);
        process.exit(-1);
    }

    if (options.initialize) {
        let library = new Library(options.libraryPath);
        await library.createTables();

        console.log(options.libraryPath + " has been initialized as Laputin library. You can now start Laputin without --initialize.")
        process.exit(0);
    }

    if (!fs.existsSync(options.libraryPath) || !fs.statSync(options.libraryPath).isDirectory()) {
        console.log(options.libraryPath + " is not a valid directory.");
        process.exit(-2);
    }

    let dbFilePath = path.join(options.libraryPath, ".laputin.db");
    if (!fs.existsSync(dbFilePath)) {
        console.log(options.libraryPath + " has not been initialized as Laputin library.");
        console.log(usage);
        process.exit(-1);
    }

    winston.info("Library path: " + options.libraryPath);

    let configFilePath = path.join(options.libraryPath, ".laputin.json");
    let configuration: LaputinConfiguration = (fs.existsSync(configFilePath))
        ? JSON.parse(fs.readFileSync(configFilePath, "utf8"))
        : new LaputinConfiguration(3200, "accurate");

    let laputin = compose(options.libraryPath, configuration);

    laputin.initializeRoutes();

    if (!options.bypassHashing) {
        winston.info("Hashing files...");
        let timer = winston.startTimer();
        await laputin.loadFiles();
        timer.done("Hashing");
    }

    await laputin.startListening();
    winston.info("Laputin started at http://localhost:" + configuration.port);
})();