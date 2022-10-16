import { TimecodeTag } from './timecode-tag';

export class Timecode {
    public durationInSeconds: number;

    constructor(
        public timecodeId: number,
        public fileId: number,
        public path: string,
        public timecodeTags: TimecodeTag[],
        public start: number,
        public end: number
    ) {
        this.durationInSeconds = this.end - this.start;
    }
}
