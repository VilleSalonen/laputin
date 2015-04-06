var _ = require("underscore");
var express = require("express");
var bodyParser = require('body-parser');
var fs = require("fs");
var path = require("path");
var exec = require('child_process').exec;

var libraryPath = "";
if (process.argv.length === 2) {
    console.log("Defaulting to current directory...");
    libraryPath = process.cwd() + "";
} else if (process.argv.length !== 3) {
    console.log("You have to pass library path as an argument.");
    process.exit(-1);
} else {
    libraryPath = process.argv.splice(2)[0];
}

console.log("Library path: " + libraryPath);

if (!fs.existsSync(libraryPath) || !fs.statSync(libraryPath).isDirectory()) {
    console.log(libraryPath + " is not a valid directory.");
    process.exit(-2);
}

if (!fs.existsSync(path.join(libraryPath, ".laputin.json"))) {
    var app = express();
    app.use(bodyParser.json({}));

    var application_root = __dirname;
    app.use(express.static(path.join(application_root, "app")));

    console.log("Laputin instance not found. You can initialize one from http://localhost:12345/setup.html");
    app.listen(12345);

    app.route("/setup/").post(function (req, res) {
        var outputFilename = libraryPath + '/.laputin.json';
        fs.writeFile(outputFilename, JSON.stringify(req.body), function(err) {
            if (err) {
                console.log(err);
                res.status(400);
            } else {
                var sqlite3 = require("sqlite3").verbose();
                var db = new sqlite3.Database(path.join(libraryPath, ".laputin.db"));
                db.run("CREATE TABLE tags (id INTEGER PRIMARY KEY autoincrement, name TEXT UNIQUE);", function () {
                    db.run("CREATE TABLE tags_files (id INTEGER, hash TEXT, PRIMARY KEY (id, hash));", function () {
                        db.run("CREATE TABLE files (hash TEXT UNIQUE, path TEXT UNIQUE, active INTEGER);", function () {
                            res.end('{"success" : "Updated Successfully", "status" : 200}', function () {
                                process.exit(0);
                            });
                        });
                    });
                });
            }
        });
    });
} else {
    var Library = require("./src/library.js").Library;
    var library = new Library(libraryPath);

    var configuration = "";
    if (fs.existsSync(path.join(libraryPath, ".laputin.json"))) {
        configuration = JSON.parse(fs.readFileSync(path.join(libraryPath, ".laputin.json"), 'utf8'));
    } else {
        console.log("No configuration file .laputin.json found. Reverting to default values.");
        configuration = {
            "fileOpener": "VLC",
            "gitVersioning": false,
            "port": 12345
        };
    }

    var port = 4242;
    if (typeof configuration.port !== "undefined") {
        var portCandidate = parseInt(configuration.port, 10);
        if (!isNaN(portCandidate)) {
            port = portCandidate;
        }
    }

    var fileOpener;
    switch (configuration.fileOpener) {
        case "quicklook":
            var QuickLook = require("./src/quick_look.js").QuickLook;
            fileOpener = new QuickLook(libraryPath);
            break;
        case "vlc":
            var VLC = require("./src/vlc.js").VLC;
            fileOpener = new VLC(libraryPath);
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

    library.load(function () {
        console.log("Starting server...");

        var app = express();
        app.use(bodyParser.json({}));

        var application_root = __dirname;
        app.use(express.static(path.join(application_root, "react")));
        app.use("/old", express.static(path.join(application_root, "app")));
        app.use("/media", express.static(libraryPath));

        app.route("/tags").get(function (req, res) {
            library.getTags({}, function (tags) {
                res.send(tags);
            });
        });

        app.route("/tags2").get(function (req, res) {
            library.getTags(req.query, function (tags) {
                res.send(_.values(tags));
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
            library.getFiles({}, function (files) {
                res.send(files);
            });
        });

        app.route("/files2").get(function (req, res) {
            library.getFiles(req.query, function (files) {
                res.send(_.values(files));
            });
        });

        app.route("/duplicates").get(function (req, res) {
            res.send(library.getDuplicates());
        });

        app.route("/files/:hash").get(function (req, res) {
            var hash = req.params.hash;
            var file = _.find(library.getFiles(), function (candidate) {
                return candidate.hash === hash;
            });

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

            var selectedFiles;
            if (_.size(selectedTags) > 0) {
                selectedFiles = _.filter(library.getFiles(), function (file) {
                    return _.every(selectedTags, function (value) {
                        var tagNames = _.pluck(file.tags, "name");
                        return _.contains(tagNames, value);
                    });
                });
            } else {
                selectedFiles = library.getFiles();
            }

            fileOpener.open(selectedFiles);
            res.status(200).end();
        });

        app.route("/open/files/").post(function (req, res) {
            var selectedHashes = req.body.selectedHashes;

            if (_.size(selectedHashes) > 0) {
                library.getFiles({}, function (files) {
                    var selectedFiles = _.filter(files, function (file) {
                        return _.contains(selectedHashes, file.hash);
                    });
                    fileOpener.open(selectedFiles);
                    res.status(200).end();
                });
            } else {
                res.status(400).send("No files selected");
            }
        });

        app.listen(port);

        console.log("Started at http://localhost:" + port);
    });
}