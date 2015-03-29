/*global require */

var crypto = require("crypto");
var fs = require("fs");

var CHUNK_SIZE = 1024;

function hash(path, callback) {
    fs.open(path, "r", function (err, fd) {
        fs.stat(path, function (err, stats) {
            var buffer = new Buffer(CHUNK_SIZE);
            var input_size = stats.size;
            var offset = parseInt(input_size / 2.0) - parseInt(CHUNK_SIZE / 2.0);

            try {
                fs.read(fd, buffer, 0, buffer.length, offset, function (e, l, b) {
                    var dataForHashing = b.toString("binary");
                    var hash = crypto.createHash("md5")
                        .update(dataForHashing)
                        .digest("hex");

                    fs.close(fd);

                    if (typeof callback !== "undefined") {
                        callback({ path: path, hash: hash });
                    }
                });
            }
            catch (e) {
                if (e.name === "TypeError" && e.message === "Bad argument")
                {
                    // If hashing is done when file is still being copied, it will
                    // fail.
                }
                else {
                    throw e;
                }
            }
        });
    });
}

exports.hash = hash;