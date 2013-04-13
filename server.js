var _ = require("underscore");
var express = require("express");
var fs = require("fs");
var path = require("path");
var YAML = require("libyaml");
var exec = require('child_process').exec;

var application_root = __dirname;
var app = express();

if (process.argv.length === 2) {
    console.log("Defaulting to current directory...");
    var libraryPath = process.cwd() + "";
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

var Library = require("./src/library.js").Library;
var library = new Library(libraryPath);


var configuration = YAML.readFileSync(path.join(libraryPath, ".laputin.yml"))[0];

switch (configuration.fileOpener) {
    case "QuickLook":
        var QuickLook = require("./src/quick_look.js").QuickLook;
        var fileOpener = new QuickLook(libraryPath);
        break;
    case "VLC":
        var VLC = require("./src/vlc.js").VLC;
        var fileOpener = new VLC(libraryPath);
        break;
    default:
        throw new Error("File opener is not specified in configuration!");
}


process.on('SIGINT', function() {
    process.chdir(libraryPath);

    if (typeof configuration.gitVersioning !== "undefined" && configuration.gitVersioning === true) {
        var message = "Saving Laputin metadata on " + (new Date());
        exec("git commit .laputin.db -m \"" + message + "\".", function () {
            console.log("EXITING!");
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

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

    app.get("/tags", function (req, res) {
        res.send(library.getTags());
    });

    app.get("/tags/:tagId", function (req, res) {
        var tagId = req.params.tagId;
        var tag = _.filter(library.getTags(), function (tag) {
            return tag.id == tagId
        });
        res.send(tag);
    });

    app.put("/tags/:tagId", function (req, res) {
        var tagId = req.params.tagId;
        var tag = req.body.tag;
        library.updateTag(tagId, tag, function (err) {
            if (err) {
                res.send(500);
            } else {
                res.send(200);
            }
        })
    });

    app.post("/tags", function (req, res) {
        var tagName = req.body.tagName;
        library.createNewTag(tagName, function (err, tag) {
            if (err)
                res.send(500, err);
            else
                res.send(200, tag);
        });
    });

    app.get("/files", function (req, res) {
        res.send(library.getFiles());
    });

    app.get("/files/:hash", function (req, res) {
        var hash = req.params.hash;
        var file = _.find(library.getFiles(), function (candidate) {
            return candidate.hash === hash;
        })

        if (file) {
            res.send(200, file);
        } else {
            res.send(404, "Could not find file.");
        }
    });

    app.post("/files/:hash/tags", function (req, res) {
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

    app.delete("/files/:hash/tags/:tagId", function (req, res) {
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

    app.get("/files/:hash/open", function (req, res) {
        var hash = req.params.hash;
        var file = _.find(library.getFiles(), function (file) {
            return file.hash === hash;
        });

        fileOpener.open([file]);
        res.send(200);
    });

    app.post("/open/tags/", function (req, res) {
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

        fileOpener.open(selectedFiles);
        res.send(200);
    });

    app.post("/open/files/", function (req, res) {
        var selectedHashes = req.body.selectedHashes;

        if (_.size(selectedHashes) > 0) {
            var selectedFiles = _.filter(library.getFiles(), function (file) {
                return _.contains(selectedHashes, file.hash);
            });
            fileOpener.open(selectedFiles);
            res.send(200);
        } else {
            res.send(400, "No files selected");
        }
    });

    app.listen(4242);

    console.log("Started at http://localhost:4242");
}
