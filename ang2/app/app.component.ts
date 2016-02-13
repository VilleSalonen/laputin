import {Component, OnInit} from 'angular2/core';
import {HTTP_PROVIDERS, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';

import { File } from "./file";
import { Tag } from "./tag";
import { LaputinService } from "./laputinservice";

@Component({
    selector: 'my-app',
    template: `
        <h1>Files</h1>
        <h2>
            <ul>
                <li *ngFor="#file of files">
                    {{file.path}}
                    
                    <ul>
                        <li *ngFor="#tag of file.tags">
                            {{tag.name}}
                        </li>
                    </ul>
                    
                    <button (click)="onSelect(file)">
                        <button>Open</button>
                    </button>
                </li>
            </ul>
        </h2>
    `,
    providers: [LaputinService, HTTP_PROVIDERS]
})
export class AppComponent implements OnInit {
    public files : File[];
    public tags : Tag[];
    
    constructor(private _service: LaputinService) {
    }
    
    ngOnInit() {
        this._service.tags.subscribe(data => {
            this.tags = [];
            data.forEach(row => this.tags.push(row));
        });
        this._service.files.subscribe(data => {
            this.files = [];
            data.forEach(row => this.files.push(row));
        });
        this._service.loadTags();
    }
    
    onSelect(file: File) {
        this._service.openFile(file);
    }
}