/// <reference path="typings/main.d.ts" />

import {Laputin} from "./server";

var libraryPath = process.env.LAPUTIN_PATH || "test-archive-no-commit";
var laputin = new Laputin(libraryPath);

laputin.initializeRoutes();
console.time("hashing");
laputin.loadFiles()
    .then(() => {
        console.timeEnd("hashing");

        var port: number = +process.env.PORT || 3200;

        laputin.app.listen(port, () => {
            console.log("Laputin started:");
            console.log("Port: " + port);
            console.log("Path: " + libraryPath);
        });
    });