import path = require('path');

import {Tag} from './tag';

export class File {
    public hash: string;
    public path: string;
    public name: string;
    public tags: Tag[];

    constructor(hash: string, filePath: string, tags: Tag[]) {
        this.hash = hash;
        this.path = filePath.replace(/\\/g, '/');
        this.name = this.cleanPath();
        this.tags = tags;
    }

    private cleanPath(): string {
        return path.basename(this.path);
    }
}
