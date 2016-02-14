import {Component, OnInit} from 'angular2/core';
import {HTTP_PROVIDERS, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';

import {File} from "./file";
import {Tag} from "./tag";
import {LaputinService} from "./laputinservice";

@Component({
    template: `    
        <table class="table table-striped">
            <tbody>
                <tr>
                    <th>
                        Showing {{files.length}} matching files

                        <a class="btn btn-primary pull-right">
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
    providers: [LaputinService, HTTP_PROVIDERS]
})
export class FilesComponent implements OnInit {
    public files : File[] = [];
    public tags : Tag[] = [];
    
    constructor(private _service: LaputinService) {
    }
    
    ngOnInit() {
        this._service.tags.subscribe((tags: Tag[]) => { this.tags = tags; });
        this._service.files.subscribe((files: File[]) => { this.files = files; });
    }
    
    
    
    onSelect(file: File) {
        this._service.openFile(file);
    }
}