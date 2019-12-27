export class LaputinConfiguration {
    constructor(
        public port: number,
        public identification: string,
        public proxyDirectory: string,
        public ignoredExtensions: string[]
    ) {}
}
