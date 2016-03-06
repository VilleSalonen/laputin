import * as _ from "lodash";

import {Tag} from "./tag";
import {TagContainer} from "./tagcontainer";

export class FileQuery implements TagContainer {
    public filename: string;
    public status: string;
    
    public andTags: Tag[] = [];
    public orTags: Tag[] = [];
    public notTags: Tag[] = [];
    
    public get tags(): Tag[] {
        return _.union(this.andTags, this.orTags, this.notTags);
    }
    
    constructor() {
        this.clear();
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
        this.andTags = this.andTags.filter((tag: Tag) => tag.id !== tagToRemove.id);
        this.orTags = this.orTags.filter((tag: Tag) => tag.id !== tagToRemove.id);
        this.notTags = this.notTags.filter((tag: Tag) => tag.id !== tagToRemove.id);
    }

    public clear(): void {
        this.filename = "";
        this.status = "both";
        this.andTags = [];
        this.orTags = [];
        this.notTags = [];
    }
}