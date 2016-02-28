import path = require("path");

import {Tag} from "./tag";

export class File {
    constructor(public hash: string, public path: string, public tags: Tag[]) {
    }

    public get name(): string {
        return path.basename(this.path);
    } 
}