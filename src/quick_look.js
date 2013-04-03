var _ = require("underscore");
var fs = require("fs");
var child_process = require("child_process");
var path = require("path");

function QuickLook(libraryPath) {
    this._child = undefined;
    this._binaryPath = "/usr/bin/qlmanage";
}

QuickLook.prototype.open = function (selectedFiles) {
    this.close();

    var params = _.pluck(selectedFiles, "path");
    params.unshift("-p");

    this._child = child_process.spawn(this._binaryPath, params);
};

QuickLook.prototype.close = function () {
    if (typeof this._child !== "undefined") {
        try {
            process.kill(this._child.pid, "SIGKILL");
        }
        catch (err) {
            console.log("Couldn't close " + this._child.pid + " due to error: " + err)
        }
    }
};

exports.QuickLook = QuickLook;