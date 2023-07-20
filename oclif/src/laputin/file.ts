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
    public active: boolean;

    constructor(
        fileId: number,
        hash: string,
        filePath: string,
        tags: Tag[],
        size: number,
        type: string,
        active: boolean,
        metadata?: any
    ) {
        this.fileId = fileId;
        this.hash = hash;
        this.path = path.normalize(filePath);
        this.name = this.cleanPath();
        this.tags = tags;
        this.size = size;
        this.type = type;
        this.active = active;
        this.metadata = metadata || {};
    }

    private cleanPath(): string {
        return path.basename(this.path);
    }
}
