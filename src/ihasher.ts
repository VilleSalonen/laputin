import fs = require('fs');

import { File } from './file';

export interface IHasher {
    hash(path: string, stats: fs.Stats): Promise<string>;
}
