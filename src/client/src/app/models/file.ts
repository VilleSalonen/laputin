import {Tag} from './tag';
import {TagContainer} from './tagcontainer';

export class File implements TagContainer {
    public name: string;

    constructor(public hash: string, public path: string, public tags: Tag[]) {
        this.name = this.path.substring(this.path.lastIndexOf('/') + 1);
    }

    public escapedUrl() {
        return this.path.replace('#', '%23');
    }

    public directory(): string {
        return this.path.replace(this.name, '').replace(/\//g, '\\');
    }

    public nameSansSuffix(): string {
        return this.name.substr(0, this.name.lastIndexOf('.'));
    }

    public suffix(): string {
        return this.name.substr(this.name.lastIndexOf('.'));
    }
}
