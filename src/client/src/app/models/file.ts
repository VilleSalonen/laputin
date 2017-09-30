import {Tag} from './tag';
import {TagContainer} from './tagcontainer';

export class File implements TagContainer {
    constructor(public hash: string, public path: string, public name: string, public tags: Tag[]) {
    }

    public escapedUrl() {
        return this.path.replace('#', '%23');
    }
}
