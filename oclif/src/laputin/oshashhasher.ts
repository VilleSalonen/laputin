import * as fs from 'fs';
import { IHasher } from './ihasher';

export class OsHashHasher implements IHasher {
    private static readonly CHUNK_SIZE = 64 * 1024; // OpenSubtitles uses 64KB chunks

    public async hash(path: string, stats: fs.Stats): Promise<string> {
        const fileHandle = await fs.promises.open(path, 'r');
        
        const headBuffer = Buffer.alloc(OsHashHasher.CHUNK_SIZE);
        const tailBuffer = Buffer.alloc(OsHashHasher.CHUNK_SIZE);

        await fileHandle.read(headBuffer, 0, headBuffer.length, 0);
        await fileHandle.read(tailBuffer, 0, tailBuffer.length, stats.size - OsHashHasher.CHUNK_SIZE);

        await fileHandle.close();

        return this.computeHash(stats.size, headBuffer, tailBuffer);
    }

    private computeHash(size: number, head: Buffer, tail: Buffer): string {
        let hash = BigInt(size);

        for (let i = 0; i < head.length; i += 8) {
            hash += head.readBigInt64LE(i);
            hash = hash & 0xFFFFFFFFFFFFFFFFn; // Wrap around to keep result 64 bits long
        }

        for (let i = 0; i < tail.length; i += 8) {
            hash += tail.readBigInt64LE(i);
            hash = hash & 0xFFFFFFFFFFFFFFFFn; // Wrap around to keep result 64 bits long
        }

        return hash.toString(16).padStart(16, '0');
    }
}
