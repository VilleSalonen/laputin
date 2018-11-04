import _ = require('lodash');
import fs = require('fs');
import child_process = require('child_process');
import path = require('path');
import os = require('os');

import {File} from './file';

export class VLCOpener {
    private _binaryPath: string;
    private _playlistPath: string;
    private _child: child_process.ChildProcess;

    constructor(libraryPath: string) {
        this._child = undefined;

        if (os.platform() === 'win32') {
            this._binaryPath = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe';
        } else {
            this._binaryPath = '/Applications/VLC.app/Contents/MacOS/VLC';
        }

        this._playlistPath = path.join(libraryPath, '.playlist.m3u');
    }

    public open(files: File[]): void {
        this.close();
        this._writeVideosToPlaylist(files);
        this._openPlayer();
    }

    public close() {
        if (typeof this._child !== 'undefined') {
            try {
                process.kill(this._child.pid, 'SIGKILL');
            } catch (err) {
                console.log('Couldn\'t close ' + this._child.pid + ' due to error: ' + err);
            }
        }
    }

    private _writeVideosToPlaylist(files: File[]): void {
        let playlist = '#EXTM3U\n';

        files = _.sortBy(files, (video) => video.path);

        _.each(files, function(video) {
            let videoPath;
            if (os.platform() === 'win32') {
                videoPath = video.path.replace(/\//g, '\\');
            } else {
                videoPath = video.path;
            }

            playlist += '#EXTINF:-1,' + videoPath + '\n';
            playlist += videoPath + '\n';
        });

        fs.writeFileSync(this._playlistPath, playlist);
    }

    private _openPlayer() {
        console.log('executing');
        console.log(`"${this._binaryPath}" "${this._playlistPath}"`);
        this._child = child_process.exec(`"${this._binaryPath}" "${this._playlistPath}"`);
    }
}
