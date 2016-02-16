import express = require("express");

var libraryPath: string = "test-archive-no-commit";

var app: express.Express = express();

app.get('/', (req, res) => {
    res.send('Testing 1 2 3');
});

app.use("/media", express.static(libraryPath));

var port: number = +process.env.PORT || 3200;

var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});