import express = require("express");

var app = express();

app.get('/', (req, res) => {
    res.send('Testing 1 2 3');
});

var port: number = +process.env.PORT || 3200;

var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});