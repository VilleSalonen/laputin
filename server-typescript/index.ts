/// <reference path="typings/tsd.d.ts" />

import {Laputin} from "./server";

var laputin = new Laputin("test-archive-no-commit");

laputin.initializeRoutes();
laputin.loadFiles();

var port: number = +process.env.PORT || 3200;

laputin.app.listen(port, () => {
  console.log('Express server listening on port ' + port);
});
