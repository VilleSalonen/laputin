import { Tag } from './tag';

export class TagQuery {
    constructor(public selectedTags: Tag[], public unassociated: boolean) {}
}
