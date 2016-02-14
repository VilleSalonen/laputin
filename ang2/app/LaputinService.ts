import {Component} from 'angular2/core';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import {Http, HTTP_PROVIDERS, Headers} from 'angular2/http';

import {File} from "./file";
import {Tag} from "./tag";

@Component({
    providers: [HTTP_PROVIDERS]
})
export class LaputinService {
    private _baseUrl: string = "http://localhost:12345"; 
    
    public tags : Observable<Tag[]>;
    public files : Observable<File[]>;
    
    constructor(private _http: Http) {
        this.tags = this._http.get(this._baseUrl + "/tags")
            .map(res => res.json())
            .map((tags: any[]): Tag[] => {
                let result: Tag[] = [];
                if (tags) {
                    tags.forEach((tag: any) => {
                        result.push(new Tag(tag.id, tag.name, tag.associationCount))
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
    
    public openFile(file: File) {
        let body = JSON.stringify({ selectedHashes: [file.hash] });
        const headers = new Headers({'Content-Type': 'application/json'});
        
        this._http.post(this._baseUrl + "/open/files/", body, { headers: headers })
                   .subscribe(
                        data => console.log("Data: " + data),
                        err => console.log("Error: " + err),
                        () => console.log("Complete")
                   );
    }
}