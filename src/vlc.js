/*global require, process */

var _ = require("underscore");
var fs = require("fs");
var child_process = require("child_process");
var path = require("path");

function VLC(libraryPath) {
    this._child = undefined;
    this._binaryPath = "/Applications/VLC.app/Contents/MacOS/VLC";
    this._playlistPath = path.join(libraryPath, ".playlist.m3u");
}

VLC.prototype.open = function (selectedVideos) {
    var self = this;
    this.close();
    this._writeVideosToPlaylist(selectedVideos, function () {
        self._openPlayer();
    });
};

VLC.prototype.close = function () {
    if (typeof this._child !== "undefined") {
        try {
            process.kill(this._child.pid, "SIGKILL");
        }
        catch (err) {
            console.log("Couldn't close " + this._child.pid + " due to error: " + err)
        }
    }
};

VLC.prototype._writeVideosToPlaylist = function (selectedVideos, callback) {
    var playlist = "#EXTM3U\n";
    _.each(selectedVideos, function (video) {
        playlist += "#EXTINF:-1," + video.path + "\n";
        playlist += video.path + "\n";
    });

    fs.writeFile(this._playlistPath, playlist, function (err) {
        if (err) throw err;
        if (typeof callback !== "undefined")
            callback();
    });
};

VLC.prototype._openPlayer = function () {
    this._child = child_process.exec(this._binaryPath + " " + this._playlistPath);
};

exports.VLC = VLC;