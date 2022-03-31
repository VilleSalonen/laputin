export class Tag {
    constructor(
        public id: number,
        public name: string,
        public associationCount: number
    ) {}
}

export class Timecode {
    constructor(
        public timecodeId: number,
        public hash: string,
        public path: string,
        public timecodeTags: TimecodeTag[],
        public start: number,
        public end: number
    ) {}
}

export class TimecodeTag {
    constructor(
        public timecodeId: number,
        public timecodeTagId: number,
        public tag: Tag
    ) {}
}
