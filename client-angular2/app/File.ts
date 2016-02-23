import {Tag} from "./tag";

export class File {
    constructor(public hash: string, public path: string, public name: string, public tags: Tag[]) {
    }
}