import { Tag } from './tag';

export class TagQuery {
    constructor(
        public tagName: string,
        public andTags: Tag[],
        public orTags: Tag[],
        public notTags: Tag[],
        public unassociated: boolean
    ) {}

    static allUnassociated() {
        return new TagQuery('', [], [], [], true);
    }

    static allAssociated() {
        return new TagQuery('', [], [], [], false);
    }
}
