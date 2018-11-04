import { TimecodeTag } from './timecode-tag';

export class Timecode {
    public cacheBuster = '';

    constructor(
        public timecodeId: number,
        public hash: string,
        public path: string,
        public timecodeTags: TimecodeTag[],
        public start: number,
        public end: number) {
    }
}
