import child_process = require('child_process');
import path = require('path');
import winston = require('winston');

import { File } from './file';

export class ExplorerOpener {
    private _binaryPath = 'C:\\WINDOWS\\explorer.exe';

    public open(file: File): void {
        let command = '';
        if (process.platform === 'win32') {
            const filePath = file.path.replace(/\//g, '\\');
            command = `"${this._binaryPath}" /select,"${filePath}"`;
        } else {
            const filePath = path.dirname(file.path);
            command = `open "${filePath}"`;
        }

        winston.verbose(`Executing ${command}...`);
        child_process.exec(command);
    }
}
