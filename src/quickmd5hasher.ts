import crypto = require('crypto');
import fs = require('fs');
import {promisify} from 'util';
const fsStat = promisify(fs.stat);
const fsOpen = promisify(fs.open);
const fsRead = promisify(fs.read);
const fsClose = promisify(fs.close);
import _ = require('lodash');

import {IHasher} from './ihasher';
import {File} from './file';

const CHUNK_SIZE = 1024;

export class QuickMD5Hasher implements IHasher {
    public async hash(path: string, existingFiles: {[path: string]: File}, stats: fs.Stats): Promise<string> {
        const escapedPath = path.replace(/\\/g, '/');
        const file = existingFiles[escapedPath];
        if (file) {
            return file.hash;
        }

        try {
            const fd = await fsOpen(path, 'r');
            if (typeof fd === 'undefined') { return; }

            return await this.readHash(fd, stats);
        } catch (e) {
            console.log(e);
            if (e.name === 'TypeError') {
                // If hashing is done when file is still being copied, it will
                // fail.
            } else {
                throw e;
            }
        }
    }

    private readHash(fd: any, stats: fs.Stats): Promise<string> {
        let done: Function;
        const promise = new Promise<string>((resolve) => done = resolve);

        const input_size: number = stats.size;
        const offset: number = Math.floor(input_size / 2.0 - CHUNK_SIZE / 2.0);
        const buffer: Buffer = Buffer.alloc(CHUNK_SIZE);

        fs.read(fd, buffer, 0, buffer.length, offset, () => {
            const hash = crypto.createHash('md5')
                .update(buffer)
                .digest('hex');

            fs.close(fd, () => {
                done(hash);
            });
        });

        return promise;
    }
}
