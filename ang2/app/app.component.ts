import {Component, OnInit} from 'angular2/core';
import {HTTP_PROVIDERS, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';

import {HeaderBarComponent} from "./headerbar.component";
import { File } from "./file";
import { Tag } from "./tag";
import { LaputinService } from "./laputinservice";

@Component({
    selector: 'my-app',
    template: `
        <header-bar></header-bar>
    
        <table className="table table-striped">
            <tbody>
                <tr>
                    <th>
                        Showing {{files.length}} matching files

                        <a className="btn btn-primary pull-right">
                            Open files
                        </a>
                    </th>
                </tr>

                <tr *ngFor="#file of files">
                    <td>
                        {{file.path}}
                        
                        <p>
                            <span *ngFor="#tag of file.tags">
                                {{tag.name}}
                            </span>
                        </p>
                        
                        <button (click)="onSelect(file)">
                            <button>Open</button>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    `,
    providers: [LaputinService, HTTP_PROVIDERS],
    directives: [HeaderBarComponent]
})
export class AppComponent implements OnInit {
    public files : File[] = [];
    public tags : Tag[] = [];
    
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