import {Pipe, PipeTransform} from "@angular/core";

import {Tag} from "./models/tag";

@Pipe({
    name: "tagfilter"
})
export class TagFilterPipe implements PipeTransform {
    transform(tags: Tag[], term: string): Tag[] {
        return tags.filter((tag: Tag) => tag.name.toLowerCase().includes(term.toLowerCase()));
    }
}