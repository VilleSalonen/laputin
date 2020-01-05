import child_process = require('child_process');

import { File } from './file';
import winston = require('winston');

export class ExplorerOpener {
    private _binaryPath = 'C:\\WINDOWS\\explorer.exe';

    public open(files: File[]): void {
        const filePath = files[0].path.replace(/\//g, '\\');
        const command = `"${this._binaryPath}" /select,"${filePath}"`;
        winston.verbose(`Executing ${command}...`);
        child_process.exec(command);
    }
}
