import { Tag } from './tag';
import { TagContainer } from './tagcontainer';

export class File implements TagContainer {
    public name: string;
    public humanSize: string;
    public escapedUrl: string;
    public directory: string;
    public nameSansSuffix: string;
    public suffix: string;
    public metadata: any;

    constructor(
        public fileId: number,
        public hash: string,
        public path: string,
        public tags: Tag[],
        public size: number,
        public type: string,
        metadata?: any
    ) {
        this.name = this.path.substring(this.path.lastIndexOf('/') + 1);
        this.escapedUrl = this.path.replace('#', '%23').replace(/ /g, '%20');
        this.directory = this.path.replace(this.name, '');
        this.nameSansSuffix = this.name.substr(0, this.name.lastIndexOf('.'));
        this.suffix = this.name.substr(this.name.lastIndexOf('.'));
        this.metadata = metadata || {};
    }
}
