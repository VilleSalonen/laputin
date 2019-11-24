import { Tag } from './tag';
import { TagContainer } from './tagcontainer';

export class FileQuery implements TagContainer {
    public filename: string;
    public status: string;
    public hash: string;

    public andTags: Tag[] = [];
    public orTags: Tag[] = [];
    public notTags: Tag[] = [];

    public get tags(): Tag[] {
        return [...new Set([...this.andTags, ...this.orTags, ...this.notTags])];
    }

    constructor(values?: any) {
        this.clear();

        if (values) {
            this.filename = values.filename;
            this.status = values.status;
            this.hash = values.hash;
            this.andTags = values.andTags;
            this.orTags = values.orTags;
            this.notTags = values.notTags;
        }
    }

    public andTag(tag: Tag) {
        this.removeTag(tag);
        this.andTags.push(tag);
    }

    public orTag(tag: Tag) {
        this.removeTag(tag);
        this.orTags.push(tag);
    }

    public notTag(tag: Tag) {
        this.removeTag(tag);
        this.notTags.push(tag);
    }

    public removeTag(tagToRemove: Tag) {
        this.andTags = this.andTags.filter(
            (tag: Tag) => tag.id !== tagToRemove.id
        );
        this.orTags = this.orTags.filter(
            (tag: Tag) => tag.id !== tagToRemove.id
        );
        this.notTags = this.notTags.filter(
            (tag: Tag) => tag.id !== tagToRemove.id
        );
    }

    public clear(): void {
        this.filename = '';
        this.status = 'both';
        this.hash = '';
        this.andTags = [];
        this.orTags = [];
        this.notTags = [];
    }

    public parametersSpecified(): boolean {
        return (
            this.filename !== '' ||
            this.status !== 'both' ||
            this.hash !== '' ||
            this.andTags.length > 0 ||
            this.orTags.length > 0 ||
            this.notTags.length > 0
        );
    }
}
