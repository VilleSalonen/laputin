export class LaputinConfiguration {
    constructor(
        public mediaPaths: string[],
        public port: number,
        public identification: string,
        public proxyDirectory?: string,
        public ignoredExtensions?: string[]
    ) {}
}
