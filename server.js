var _ = require("underscore");
var express = require("express");
var bodyParser = require('body-parser');
var fs = require("fs");
var path = require("path");
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

if (fs.existsSync(path.join(libraryPath, ".laputin.json"))) {
    var configuration = JSON.parse(fs.readFileSync(path.join(libraryPath, ".laputin.json"), 'utf8'));
} else {
    console.log("No configuration file .laputin.json found. Reverting to default values.");
    var configuration = {
        "fileOpener": "VLC",
        "gitVersioning": false,
        "port": 12345
    };
}

var port = 4242;
if (typeof configuration.port !== "undefined") {
    var portCandidate = parseInt(configuration.port, 10);
    if (portCandidate != NaN) {
        port = portCandidate;
    }
}

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
        exec("git commit .laputin.db -m \"" + message + "\".", function (err) {
            if (err) {
                console.log("Saving failed: " + err);
                process.exit(1);
            } else {
                console.log("Saving library and exiting.");
                process.exit(0);
            }
        });
    } else {
        process.exit(0);
    }
});

library.load(startServer);

function startServer() {
    console.log("Starting server...");

    app.use(bodyParser.json());

    app.use(express.static(path.join(application_root, "app")));

    app.route("/tags").get(function (req, res) {
        library.getTags(function (tags) {
            res.send(tags);
        });
    });

    app.route("/tags/:tagId")
        .get(function (req, res) {
            var tagId = req.params.tagId;
            var tag = _.filter(library.getTags(), function (tag) {
                return tag.id == tagId
            });
            res.status(200).send(tag);
        })
        .put(function (req, res) {
            var tagId = req.params.tagId;
            var tag = req.body.tag;
            library.updateTag(tagId, tag, function (err) {
                if (err) {
                    res.status(500).end();
                } else {
                    res.status(200).end();
                }
            })
        });

    app.route("/tags").post(function (req, res) {
        var tagName = req.body.tagName;
        library.createNewTag(tagName, function (err, tag) {
            if (err)
                res.status(500).send(err);
            else
                res.status(200).send(tag);
        });
    });

    app.route("/files").get(function (req, res) {
        library.getFiles(function (files) {
            res.send(files);
        });
    });

    app.route("/duplicates").get(function (req, res) {
        res.send(library.getDuplicates());
    });

    app.route("/files/:hash").get(function (req, res) {
        var hash = req.params.hash;
        var file = _.find(library.getFiles(), function (candidate) {
            return candidate.hash === hash;
        })

        if (file) {
            res.status(200).send(file);
        } else {
            res.status(404).send("Could not find file.");
        }
    });

    app.route("/files/:hash/tags").post(function (req, res) {
        var selectedTags = req.body.selectedTags;

        _.each(selectedTags, function (tag) {
            library.createNewLinkBetweenTagAndFile(tag, req.params.hash);
        });
        res.status(200).end();
    });

    app.route("/files/:hash/tags/:tagId").delete(function (req, res) {
        library.deleteLinkBetweenTagAndFile(req.params.tagId, req.params.hash);
        res.status(200).end();
    });

    app.route("/files/:hash/open").get(function (req, res) {
        var hash = req.params.hash;
        library.getFiles(function (files) {
            if (typeof files[hash] === "undefined") {
                res.status(404).end();
            } else {
                fileOpener.open([files[hash]]);
                res.status(200).end();
            }
        });
    });

    app.route("/open/tags/").post(function (req, res) {
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
        res.status(200).end();
    });

    app.route("/open/files/").post(function (req, res) {
        var selectedHashes = req.body.selectedHashes;

        if (_.size(selectedHashes) > 0) {
            var selectedFiles = _.filter(library.getFiles(), function (file) {
                return _.contains(selectedHashes, file.hash);
            });
            fileOpener.open(selectedFiles);
            res.status(200).end();
        } else {
            res.status(400).send("No files selected");
        }
    });

    app.listen(port);

    console.log("Started at http://localhost:" + port);
}
