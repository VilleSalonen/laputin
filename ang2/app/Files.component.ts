import {Component, OnInit} from 'angular2/core';
import {HTTP_PROVIDERS, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';

import {File} from "./file";
import {Tag} from "./tag";
import {LaputinService} from "./laputinservice";
import {SearchBox} from "./searchbox.component";
import {FileNamePipe} from "./filenamepipe";

@Component({
    pipes: [FileNamePipe],
    template: `
        <search-box (update)="term = $event"></search-box>
    
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

                <tr *ngFor="#file of files | filenamefilter: term">
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
    directives: [SearchBox]
})
export class FilesComponent implements OnInit {
    public files: File[] = [];
    public tags: Tag[] = [];
    
    constructor(private _service: LaputinService) {
    }
    
    ngOnInit(): void {
        this._service.tags.subscribe((tags: Tag[]) => { this.tags = tags; });
        this._service.files.subscribe((files: File[]) => { this.files = files; });
    }
    
    onSelect(file: File): void {
        this._service.openFile(file);
    }
}