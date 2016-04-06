import _ = require("lodash");
import fs = require("fs");
import child_process = require("child_process");
import path = require("path");
import os = require("os");

import {File} from "./file";

export class VLCOpener {
    private _binaryPath: string;
    private _playlistPath: string;
    private _child: child_process.ChildProcess;

    constructor(libraryPath: string) {
        this._child = undefined;

        if (os.platform() === "win32") {
            this._binaryPath = "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe";
        } else {
            this._binaryPath = "/Applications/VLC.app/Contents/MacOS/VLC";
        }

        this._playlistPath = path.join(libraryPath, ".playlist.m3u");
    }

    public async open(files: File[]): Promise<void> {
        this.close();
        await this._writeVideosToPlaylist(files);
        return this._openPlayer();
    }

    public close() {
        if (typeof this._child !== "undefined") {
            try {
                process.kill(this._child.pid, "SIGKILL");
            }
            catch (err) {
                console.log("Couldn't close " + this._child.pid + " due to error: " + err)
            }
        }
    };

    private _writeVideosToPlaylist(files: File[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            var playlist = "#EXTM3U\n";

            files = _.sortBy(files, function(video) { return video.path });

            _.each(files, function(video) {
                if (os.platform() === "win32") {
                    var videoPath = video.path.replace(/\//g, "\\");
                } else {
                    var videoPath = video.path;
                }
                
                playlist += "#EXTINF:-1," + videoPath + "\n";
                playlist += videoPath + "\n";
            });

            fs.writeFile(this._playlistPath, playlist, function(err) {
                if (err) reject(err);
                resolve();
            });
        });
    }

    private _openPlayer() {
        this._child = child_process.exec("\"" + this._binaryPath + "\" " + this._playlistPath);
    };
}