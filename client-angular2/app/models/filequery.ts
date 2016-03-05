import * as _ from "lodash";

import {Tag} from "./tag";

export class FileQuery {
    public filename: string;
    public status: string;
    
    public andTags: Tag[] = [];
    
    constructor() {
        this.clear();
    }

    public andTag(tag: Tag) {
        this.andTags.push(tag);
    }

    public removeTag(tagToRemove: Tag) {
        this.andTags = this.andTags.filter((tag: Tag) => tag.id !== tagToRemove.id);
    }

    public clear(): void {
        this.filename = "";
        this.status = "both";
        this.andTags = [];
    }
}