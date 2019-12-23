import { TimecodeTag } from './timecode-tag';

export class Timecode {
    public cacheBuster = '';
    public durationInSeconds: number;

    constructor(
        public timecodeId: number,
        public hash: string,
        public path: string,
        public timecodeTags: TimecodeTag[],
        public start: number,
        public end: number
    ) {
        this.durationInSeconds = this.end - this.start;
    }
}
