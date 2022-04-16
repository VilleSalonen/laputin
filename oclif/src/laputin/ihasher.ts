import * as fs from 'fs';

export interface IHasher {
    hash(path: string, stats: fs.Stats): Promise<string>;
}
