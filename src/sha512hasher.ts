import crypto = require('crypto');
import fs = require('fs');

import {IHasher} from './ihasher';
import {File} from './file';

export class Sha512Hasher implements IHasher {
    public hash(path: string, stats: fs.Stats): Promise<string> {
        let done: Function;
        const promise = new Promise<string>((resolve, reject) => done = resolve);

        const shasum = crypto.createHash('sha512');

        try {
            const s = fs.createReadStream(path);
            s.on('data', (d: any) => { shasum.update(d); });
            s.on('end', () => {
                const hash = shasum.digest('hex');
                done(hash);
            });
        } catch (e) {
            if (e.name === 'TypeError' && e.message === 'Bad argument') {
                // If hashing is done when file is still being copied, it will
                // fail.
            } else {
                throw e;
            }
        }

        return promise;
    }
}
