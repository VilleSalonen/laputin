import { File } from './file';
import { Tag } from './tag';

export class FileTagLink {
    constructor(public file: File, public tag: Tag) {}
}
