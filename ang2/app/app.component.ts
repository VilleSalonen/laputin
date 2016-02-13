import {Component} from 'angular2/core';
import {Http, HTTP_PROVIDERS, Headers} from 'angular2/http';

import { File } from "./file";
import { Tag } from "./tag";
import { LaputinService } from "./laputinservice";

@Component({
    selector: 'my-app',
    template: `
        <h1>Tags</h1>
        <h2>
            <ul>
                <li *ngFor="#tag of tags">
                    {{tag.name}} ({{tag.associationCount}})
                </li>
            </ul>
        </h2>
        
        <h1>Files</h1>
        <h2>
            <ul>
                <li *ngFor="#file of files">
                    {{file.path}}
                    
                    <button (click)="onSelect(file)">
                        <button>Login!</button>
                    </button>
                </li>
            </ul>
        </h2>
    `,
    providers: [HTTP_PROVIDERS]
})
export class AppComponent {
    service: LaputinService;
    http: Http;
    
    public files : File[];
    public tags : Tag[];
    
    constructor(http: Http) {
        this.service = new LaputinService();
        this.http = http;
        
        http.get('http://localhost:12345/tags').subscribe(res => {
            this.tags = [];
            res.json().map((tag: any) => this.tags.push(new Tag(tag.id, tag.name, tag.associationCount)));
        });
        
        http.get('http://localhost:12345/files').subscribe(res => {
            this.files = [];
            res.json().map((file: any) => this.files.push(new File(file.hash, file.path, [])));
        });
    }
    
    onSelect(file: File) {
        let body = JSON.stringify({ selectedHashes: [file.hash] });
        const headers = new Headers({'Content-Type': 'application/json'});
        
        this.http.post("http://localhost:12345/open/files/", body, { headers: headers })
                   .subscribe(
                        data => console.log("Data: " + data),
                        err => console.log("Error: " + err),
                        () => console.log("Complete")
                   );
    }
}