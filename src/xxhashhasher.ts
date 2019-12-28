import fs = require('fs');

import { IHasher } from './ihasher';
const XXHash = require('xxhash');

export class XxhashHasher implements IHasher {
    public hash(path: string, _stats: fs.Stats): Promise<string> {
        let done: Function;
        let onError: Function;
        const promise = new Promise<string>((resolve, reject) => {
            done = resolve;
            onError = reject;
        });

        try {
            const hasher = new XXHash(0xcafebabe);

            const s = fs.createReadStream(path);
            s.on('data', (d: any) => hasher.update(d));
            s.on('end', () => done(hasher.digest('hex')));
        } catch (e) {
            if (e.name === 'TypeError' && e.message === 'Bad argument') {
                // If hashing is done when file is still being copied, it will
                // fail.
            } else {
                onError(e);
            }
        }

        return promise;
    }
}
