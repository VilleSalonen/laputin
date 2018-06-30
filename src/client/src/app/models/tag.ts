export class Tag {
    constructor(public id: number, public name: string, public associationCount: number) {
    }
}

export class TagTimecode {
    public cacheBuster = '';

    constructor(public timecodeId: number, public tagId: number, public name: string, public start: number, public end: number) {
    }
}

export enum TagStatus {
    And,
    Or,
    Not
}
