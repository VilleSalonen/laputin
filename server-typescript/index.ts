/// <reference path="typings/main.d.ts" />

import {Laputin} from "./server";

var laputin = new Laputin("test-archive-no-commit");

laputin.initializeRoutes();
console.time("hashing");
laputin.loadFiles()
    .then(() => {
        console.timeEnd("hashing");
        
        var port: number = +process.env.PORT || 3200;

        laputin.app.listen(port, () => {
        console.log('Express server listening on port ' + port);
        });
    });
