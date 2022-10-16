import path = require('path');

export class LaputinConfiguration {
    public mediaPaths: string[];

    constructor(
        mediaPaths: string[],
        public port: number,
        public identification: string,
        public proxyDirectory?: string,
        public ignoredExtensions?: string[]
    ) {
        this.mediaPaths = mediaPaths.map((mediaPath) =>
            path.normalize(mediaPath)
        );
    }
}
