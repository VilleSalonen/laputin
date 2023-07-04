import crypto = require('crypto');
import fs = require('fs');

import { IHasher } from './ihasher';

const CHUNK_SIZE = 1024;

export class QuickMD5Hasher implements IHasher {
    public async hash(path: string, stats: fs.Stats): Promise<string> {
        try {
            const fileHandle = await fs.promises.open(path, 'r');
            if (typeof fileHandle === 'undefined') {
                return '';
            }

            return await this.readHash(path, fileHandle, stats);
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
        path: string,
        fileHandle: fs.promises.FileHandle,
        stats: fs.Stats
    ): Promise<string> {
        const inputSize: number = stats.size;

        const initialOffset: number = Math.floor(
            inputSize / 2.0 - CHUNK_SIZE / 2.0
        );
        let offset = initialOffset;

        let buffer: Buffer;
        let allIdenticalBytes = true;
        let firstPass = true;

        // This is a bit ugly but the idea is to find a chunk of data which contains non-identical bytes.
        // In practice files with different content should contain non-identical middle chunk but in practice
        // a couple of cases were observed where a middle chunk (and few chunks next to it) were full of uint 255 values.
        do {
            if (offset + CHUNK_SIZE > inputSize) {
                // Very rare case but let's at least throw an error instead of silently failing.
                throw Error(
                    `Could not find a chunk of non-identical bytes between the middle of the file and the end of the file: ${path}`
                );
            }

            if (!firstPass) {
                offset += CHUNK_SIZE;
            }
            firstPass = false;

            buffer = Buffer.alloc(CHUNK_SIZE);
            await fileHandle.read(buffer, 0, buffer.length, offset);

            const firstByte = buffer[0];
            for (let i = 1; i < buffer.length; i++) {
                const currentByte = buffer[i];
                if (currentByte !== firstByte) {
                    allIdenticalBytes = false;
                    break;
                }
            }
        } while (allIdenticalBytes);

        fileHandle.close();

        return crypto.createHash('md5').update(buffer).digest('hex');
    }
}
