import {Pipe} from "angular2/core";

import {Tag} from "./tag";

@Pipe({
    name: "tagfilter"
})
export class TagsPipe {
    transform(tags: Tag[], [term]): Tag[] {
        return tags.filter((tag: Tag) => tag.name.toLowerCase().includes(term.toLowerCase()));
    }
}