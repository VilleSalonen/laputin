import {File} from './../models/file';

export class FileChange {
    constructor(public currentFile: File, public direction: ChangeDirection, public random: boolean) {
    }
}

export enum ChangeDirection {
    Previous,
    Next
}
