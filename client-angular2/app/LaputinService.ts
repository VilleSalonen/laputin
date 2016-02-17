import {Component} from "angular2/core";
import {Observable} from "rxjs/Rx";
import "rxjs/add/operator/map";
import {Http, HTTP_PROVIDERS, Headers, Response} from "angular2/http";

import {File} from "./file";
import {Tag} from "./tag";
import {Duplicate} from "./duplicate";

@Component({
    providers: [HTTP_PROVIDERS]
})
export class LaputinService {
    private _baseUrl: string = "http://localhost:3200"; 
    
    public tags: Observable<Tag[]>;
    public files: Observable<File[]>;
    public duplicates: Observable<any>;
    
    constructor(private _http: Http) {
        this.tags = this._http.get(this._baseUrl + "/tags")
            .map(res => res.json())
            .map((tags: any[]): Tag[] => {
                let result: Tag[] = [];
                if (tags) {
                    tags.forEach((tag: any) => {
                        result.push(this._convertTag(tag))
                    });
                }
                return result;
            });
        
        this.files = this._http.get(this._baseUrl + "/files")
            .map(res => res.json())
            .map((files: any[]): File[] => {
                let result: File[] = [];
                if (files) {
                    files.forEach((file: any) => {
                        result.push(this._convertFile(file));
                    });
                }
                
                return result;
            });
        
        this.duplicates = this._http.get(this._baseUrl + "/duplicates")
            .map(res => res.json())
            .map((duplicates: any[]): any[] => {
                let result: Duplicate[] = [];
                for (let dup of Reflect.ownKeys(duplicates)) {
                    var current = duplicates[dup];
                    
                    let files = current.map((file: any) => new File(file.hash, file.path, []));
                    
                    result.push(new Duplicate(dup, files));
                }
                return result;
            });
    }
    
    private _convertTag(tag: any): Tag {
        return new Tag(tag.id, tag.name, tag.associationCount);
    }
    
    private _convertTags(tags: any): Tag[] {
        return tags.map((tag: any) => this._convertTag(tag));
    }
    
    private _convertFile(file: any): File {
        return new File(file.hash, file.path, this._convertTags(file.tags));
    }
    
    public openFile(file: File): void {
        this.openFiles([file]);
    }
    
    public openFiles(files: File[]): void {
        let hashes = files.map(file => file.hash);
        
        let body = JSON.stringify({ selectedHashes: hashes });
        const headers = new Headers({"Content-Type": "application/json"});
        
        this._http.post(this._baseUrl + "/open/files/", body, { headers: headers })
                   .subscribe(
                        data => console.log("Data: " + data),
                        err => console.log("Error: " + err),
                        () => console.log("Complete")
                   );
    }
    
    public createTag(file: File, newTagName: string): void {
        let body = JSON.stringify({ tagName: newTagName });
        const headers = new Headers({'Accept': 'application/json', "Content-Type": "application/json"});
        
        this._http.post(this._baseUrl + "/tags", body, { headers: headers })
                   .subscribe(
                        data => {
                            var tag = this._convertTag(data.json());
                            this.addTag(file, tag);
                        },
                        err => console.log("Error: " + err),
                        () => console.log("Complete")
                   );
    }
    
    public addTag(file: File, tag: Tag): void {
        let body = JSON.stringify({
                selectedTags: [tag]
            });
        const headers = new Headers({'Accept': 'application/json', "Content-Type": "application/json"});
        
        this._http.post(this._baseUrl + "/files/" + file.hash + "/tags", body, { headers: headers })
                   .subscribe(
                        data => console.log("Data: " + data),
                        err => console.log("Error: " + err),
                        () => console.log("Complete")
                   );
    }
}