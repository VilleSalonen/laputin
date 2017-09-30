import {File} from './file';

export class Duplicate {
    constructor(public hash: string, public files: File[]) {
    }
}
