import fs = require('fs');

export interface IHasher {
    hash(path: string, stats: fs.Stats): Promise<string>;
}
