export interface IHasher {
    hash(path: string, callback: ((f: any) => void)): void;
}