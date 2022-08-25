import crypto = require('crypto');
import * as fs from 'fs';

import { IHasher } from './ihasher';

const CHUNK_SIZE = 1024;

export class QuickMD5Hasher implements IHasher {
    public async hash(path: string, stats: fs.Stats): Promise<string> {
        try {
            const fileHandle = await fs.promises.open(path, 'r');
            if (typeof fileHandle === 'undefined') {
                return '';
            }

            return await this.readHash(fileHandle, stats);
        } catch (e) {
            console.log(e);
            if ((<any>e).name === 'TypeError') {
                // If hashing is done when file is still being copied, it will
                // fail.
                return '';
            } else {
                throw e;
            }
        }
    }

    private async readHash(
        fileHandle: fs.promises.FileHandle,
        stats: fs.Stats
    ): Promise<string> {
        const input_size: number = stats.size;
        const offset: number = Math.floor(input_size / 2.0 - CHUNK_SIZE / 2.0);
        const buffer: Buffer = Buffer.alloc(CHUNK_SIZE);

        await fileHandle.read(buffer, 0, buffer.length, offset);
        fileHandle.close();

        return crypto.createHash('md5').update(buffer).digest('hex');
    }
}
