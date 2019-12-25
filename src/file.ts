import path = require('path');

import {Tag} from './tag';

export class File {
    public hash: string;
    public path: string;
    public name: string;
    public tags: Tag[];
    public size: number;
    public metadata: any;
    public type: string;

    constructor(hash: string, filePath: string, tags: Tag[], size: number, type: string, metadata?: any) {
        this.hash = hash;
        this.path = filePath.replace(/\\/g, '/');
        this.name = this.cleanPath();
        this.tags = tags;
        this.size = size;
        this.type = type;
        this.metadata = metadata || {};
    }

    private cleanPath(): string {
        return path.basename(this.path);
    }
}
