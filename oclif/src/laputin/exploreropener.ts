import child_process = require('child_process');
import path = require('path');
import winston = require('winston');

import { File } from './file';

export class ExplorerOpener {
    private _binaryPath = 'C:\\WINDOWS\\explorer.exe';

    public open(files: File[]): void {
        var command = '';
        if (process.platform === 'win32') {
            const filePath = files[0].path.replace(/\//g, '\\');
            command = `"${this._binaryPath}" /select,"${filePath}"`;
        } else {
            const filePath = path.dirname(files[0].path);
            command = `open "${filePath}"`;
        }

        winston.verbose(`Executing ${command}...`);
        child_process.exec(command);
    }
}
