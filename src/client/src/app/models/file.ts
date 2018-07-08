import {Tag} from './tag';
import {TagContainer} from './tagcontainer';

export class File implements TagContainer {
    public name: string;
    public humanSize: string;

    constructor(public hash: string, public path: string, public tags: Tag[], public size: number) {
        this.name = this.path.substring(this.path.lastIndexOf('/') + 1);
        this.humanSize = this.formatHumanSize();
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

    private formatHumanSize(): string {
        if (this.size < 1000) {
            return this.size + ' B';
        } else if (this.size < 1000000) {
            return (this.size / 1000.0).toFixed(1) + ' kB';
        } else if (this.size < 1000000000) {
            return (this.size / 1000000.0).toFixed(1) + ' MB';
        } else {
            return (this.size / 1000000000.0).toFixed(1) + ' GB';
        }
    }
}
