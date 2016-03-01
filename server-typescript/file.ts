import path = require("path");

import {Tag} from "./tag";

export class File {
    public hash: string;
    public path: string;
    public tags: Tag[];
    
    constructor(hash: string, path: string, tags: Tag[]) {
        this.hash = hash;
        this.path = path.replace("\\", "/");
        this.tags = tags;
    }

    public get name(): string {
        return path.basename(this.path);
    } 
}