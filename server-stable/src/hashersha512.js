/*global require */

var crypto = require("crypto");
var fs = require("fs");

function hash(path, callback) {
    var shasum = crypto.createHash("sha512");

    try {
        var s = fs.ReadStream(path);
        s.on('data', function(d) { shasum.update(d); });
        s.on('end', function() {
            var d = shasum.digest('hex');
            if (typeof callback !== "undefined") {
                callback({ path: path, hash: d });
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
}

exports.hash = hash;
exports.name = "Accurate (Full file SHA512)";