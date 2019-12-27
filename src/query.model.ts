export class Query {
    constructor(
        public filename: string,
        public status: string,
        public hash: string,
        public and: string,
        public or: string,
        public not: string,
        public includeInactive: boolean
    ) {}
}
