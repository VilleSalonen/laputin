export class FileQuery {
    public filename: string;
    public status: string;
    
    constructor() {
        this.clear();
    }

    public clear(): void {
        this.filename = "";
        this.status = "both";
    }
}