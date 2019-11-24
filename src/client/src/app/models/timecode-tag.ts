import { Tag } from './tag';

export class TimecodeTag {
    constructor(
        public timecodeId: number,
        public timecodeTagId: number,
        public tag: Tag
    ) {}
}
