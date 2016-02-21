/// <reference path="typings/tsd.d.ts" />

import {server} from "./server";

var port: number = +process.env.PORT || 3200;

server.listen(port, () => {
  console.log('Express server listening on port ' + port);
});