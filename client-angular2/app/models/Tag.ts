export class Tag {
    constructor(public id: number, public name: string, public associationCount: number) {
    }
}

export enum TagStatus {
    And,
    Or,
    Not
}