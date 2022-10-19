import fs = require('fs');
import child_process = require('child_process');
import path = require('path');
import os = require('os');

import { File } from './file';
import winston = require('winston');

export class VLCOpener {
    private _binaryPath: string;
    private _playlistPath: string;
    private _child: child_process.ChildProcess | undefined;

    constructor(libraryPath: string) {
        this._child = undefined;

        if (os.platform() === 'win32') {
            this._binaryPath = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe';
        } else {
            this._binaryPath = '/Applications/VLC.app/Contents/MacOS/VLC';
        }

        const laputinDirectory = path.join(libraryPath, 'public/');
        this._playlistPath = path.join(laputinDirectory, 'playlist.m3u');
    }

    public open(files: File[]): void {
        this.close();
        this._writeVideosToPlaylist(files);
        this._openPlayer();
    }

    public close() {
        if (this._child !== undefined) {
            try {
                if (this._child.pid) {
                    process.kill(this._child.pid, 'SIGKILL');
                }
            } catch (err) {
                console.log(
                    `Couldn't close ${this._child.pid} due to error: ${err}`
                );
            }
        }
    }

    private _writeVideosToPlaylist(files: File[]): void {
        let playlist = '#EXTM3U\n';

        files = files.sort((a, b) => (a.path > b.path ? 1 : -1));

        files.forEach((video) => {
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
        winston.verbose(
            `Executing: "${this._binaryPath}" "${this._playlistPath}"`
        );
        this._child = child_process.exec(
            `"${this._binaryPath}" "${this._playlistPath}"`
        );
    }
}
