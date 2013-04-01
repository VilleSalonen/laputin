var _ = require('underscore');
var express = require("express");
var fs = require("fs");
var path = require("path");

var application_root = __dirname;
var app = express();

if (process.argv.length === 2) {
    console.log("Defaulting to current directory...");
    var libraryPath = process.cwd() + '';
} else if (process.argv.length !== 3) {
    console.log("You have to pass library path as an argument.");
    process.exit(code = -1);
} else {
    var libraryPath = process.argv.splice(2)[0];
}

console.log("Library path: " + libraryPath);

if (!fs.existsSync(libraryPath) || !fs.statSync(libraryPath).isDirectory()) {
    console.log(libraryPath + " is not a valid directory.");
    process.exit(code = -2);
}



var Library = require('./src/library.js').Library;
var library = new Library(libraryPath);

//var VLC = require('./src/vlc.js').VLC;
//var vlc = new VLC(libraryPath);

var QuickLook = require('./src/quick_look.js').QuickLook;
var quickLook = new QuickLook(libraryPath);


library.load(startServer);

function startServer() {
    console.log("Starting server...");

    app.configure(function () {
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(path.join(application_root, "app")));
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.get('/tags', function (req, res) {
        res.send(library.getTags());
    });

    app.get('/tags/:tagId', function (req, res) {
        var tagId = req.params.tagId;
        var tag = _.filter(library.getTags(), function (tag) {
            return tag.id == tagId
        });
        res.send(tag);
    });

    app.post('/tags', function (req, res) {
        var tagName = req.body.tagName;
        library.createNewTag(tagName, function (tag) {
            res.send(200, tag);
        });
    });

    app.get('/files', function (req, res) {
        res.send(library.getFiles());
    });

    app.post('/files/:hash/tags', function (req, res) {
        var hash = req.params.hash;
        var file = _.find(library.getFiles(), function (file) {
            return file.hash === hash;
        });

        var selectedTags = req.body.selectedTags;

        _.each(selectedTags, function (tag) {
            library.createNewLinkBetweenTagAndFile(tag, file);
        });
        res.send(200);
    });

    app.delete('/files/:hash/tags/:tagId', function (req, res) {
        var hash = req.params.hash;
        var file = _.find(library.getFiles(), function (file) {
            return file.hash === hash;
        });

        var tagId = req.params.tagId;
        var tag = _.find(library.getTags(), function (tag) {
            return tag.id == tagId;
        });

        library.deleteLinkBetweenTagAndFile(tag, file, function () {
            res.send(200);
        });
    });

    app.get('/files/:hash/open', function (req, res) {
        var hash = req.params.hash;
        var file = _.find(library.getFiles(), function (file) {
            return file.hash === hash;
        });

        quickLook.open([file]);
        res.send(200);
    });

    app.post('/open/tags/', function (req, res) {
        var selectedTags = req.body.selectedTags;

        if (_.size(selectedTags) > 0) {
            var selectedFiles = _.filter(library.getFiles(), function (file) {
                return _.every(selectedTags, function (value) {
                    var tagNames = _.pluck(file.tags, "name");
                    return _.contains(tagNames, value);
                });
            });
        } else {
            var selectedFiles = library.getFiles();
        }

        quickLook.open(selectedFiles);
        res.send(200);

        //res.send('Started ' + child.pid);
    });

    app.get('/close', function (req, res) {
        //res.send('Closed ' + child.pid);
    });

    app.listen(4242);

    console.log("Started at http://localhost:4242");
}
