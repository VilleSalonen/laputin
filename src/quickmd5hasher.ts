import crypto = require('crypto');
import fs = require('fs');

import {IHasher} from './ihasher';

const CHUNK_SIZE = 1024;

export class QuickMD5Hasher implements IHasher {
    public hash(path: string): Promise<any> {
        let done: Function;
        const promise = new Promise<File>((resolve, reject) => done = resolve);

        try {
            fs.open(path, 'r', function(err, fd) {
                if (err) { return; }
                if (typeof fd === 'undefined') { return; }

                fs.stat(path, function(innerErr, stats) {
                    if (innerErr) { return; }

                    // Sometimes stats is undefined. This is probably due to file being
                    // moved elsewhere or deleted.
                    if (typeof stats === 'undefined') { return; }

                    const input_size: number = stats.size;
                    const offset: number = input_size / 2.0 - CHUNK_SIZE / 2.0;
                    const buffer: Buffer = new Buffer(CHUNK_SIZE);

                    fs.read(fd, buffer, 0, buffer.length, offset, function(e, l, b) {
                        const hash = crypto.createHash('md5')
                            .update(buffer)
                            .digest('hex');

                        fs.close(fd, () => {
                            done({ path: path, hash: hash });
                        });
                    });
                });
            });
        } catch (e) {
            console.log(e);
            if (e.name === 'TypeError') {
                // If hashing is done when file is still being copied, it will
                // fail.
            } else {
                throw e;
            }
        }

        return promise;
    }
}
