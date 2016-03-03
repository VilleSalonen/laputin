export class FileQuery {
    public filename: string;
    
    constructor() {
        this.clear();
    }

    public clear(): void {
        this.filename = "";
    }
}