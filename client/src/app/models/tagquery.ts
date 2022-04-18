import { Tag } from './tag';
import { TagContainer } from './tagcontainer';
import { TagQuerySort } from './tagquerysort';

export class TagQuery implements TagContainer {
    public tagName: string;

    public andTags: Tag[] = [];
    public orTags: Tag[] = [];
    public notTags: Tag[] = [];

    public sort = TagQuerySort.TagName;

    public unassociated: boolean = false;

    public get tags(): Tag[] {
        return [...new Set([...this.andTags, ...this.orTags, ...this.notTags])];
    }

    constructor(values?: any) {
        this.clear();

        if (values) {
            this.tagName = values.tagName;
            this.andTags = values.andTags;
            this.orTags = values.orTags;
            this.notTags = values.notTags;
            this.sort = values.sort || TagQuerySort.TagName;
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

    public isEmpty(): boolean {
        return (
            this.tagName === '' &&
            this.andTags.length === 0 &&
            this.orTags.length === 0 &&
            this.notTags.length === 0
        );
    }

    public clear(): void {
        this.tagName = '';
        this.andTags = [];
        this.orTags = [];
        this.notTags = [];
        this.sort = TagQuerySort.TagName;
    }

    public parametersSpecified(): boolean {
        return (
            this.tagName !== '' ||
            this.andTags.length > 0 ||
            this.orTags.length > 0 ||
            this.notTags.length > 0
        );
    }
}
