import File = require("./file");

export interface IHasher {
    hash(path: string): Promise<any>;
}