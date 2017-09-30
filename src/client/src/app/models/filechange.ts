export class FileChange {
    constructor(public direction: ChangeDirection, public random: boolean) {
    }
}

export enum ChangeDirection {
    Previous,
    Next
}
