/// <reference path="typings/main.d.ts" />
/// <reference path="command-line-args.d.ts" />

import commandLineArgs = require("command-line-args");
import fs = require("fs");
import path = require("path");

import {Laputin} from "./laputin";
import {Library} from "./library";
import {LaputinConfiguration} from "./laputinconfiguration";

(async function() {
    let cli = commandLineArgs([
        { name: "libraryPath", type: String, multiple: false, defaultOption: true },
        { name: "initialize", type: Boolean, multiple: false },
    ]);

    let options = cli.parse();

    if (!options.libraryPath) {
        console.log("You have to pass library path as an argument.");
        console.log(cli.getUsage());
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
        console.log(cli.getUsage());
        process.exit(-1);
    }

    console.log("Library path: " + options.libraryPath);

    let configFilePath = path.join(options.libraryPath, ".laputin.json");
    let configuration: LaputinConfiguration;
    if (fs.existsSync(configFilePath)) {
        configuration = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    } else {
        configuration = new LaputinConfiguration(3200);
    }

    let laputin = new Laputin(options.libraryPath, configuration);

    laputin.initializeRoutes();

    console.time("hashing");
    await laputin.loadFiles();
    console.timeEnd("hashing");

    laputin.app.listen(configuration.port, () => {
        console.log("Laputin started at http://localhost:" + configuration.port);
    });
})();