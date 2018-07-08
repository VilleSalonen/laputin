import fs = require('fs');

import { File } from './file';

export interface IHasher {
    hash(path: string, existingFiles: File[], stats: fs.Stats): Promise<string>;
}
