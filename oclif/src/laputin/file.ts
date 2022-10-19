import path = require('path');

import { Tag } from './tag';

export class File {
    public fileId: number;
    public hash: string;
    public path: string;
    public name: string;
    public tags: Tag[];
    public size: number;
    public metadata: any;
    public type: string;

    constructor(
        fileId: number,
        hash: string,
        filePath: string,
        tags: Tag[],
        size: number,
        type: string,
        metadata?: any
    ) {
        this.fileId = fileId;
        this.hash = hash;
        this.path = path.normalize(filePath);
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
