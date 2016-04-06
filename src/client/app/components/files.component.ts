import {Component, OnInit, Injectable, Inject} from "angular2/core";
import {HTTP_PROVIDERS, Headers} from "angular2/http";
import {Observable} from "rxjs/Rx";

import {File} from "./../models/file";
import {Tag} from "./../models/tag";
import {FileQuery} from "./../models/filequery";
import {LaputinService} from "./../services/laputinservice";
import {FileSearchComponent} from "./filesearch.component";
import {FileRowComponent} from "./file.component";

@Component({
    template: `
        <file-search (update)="filterFiles($event)"></file-search>
    
        <table class="table table-striped">
            <tbody>
                <tr>
                    <th>
                        Showing {{files.length}} matching files

                        <a class="btn btn-primary pull-right" (click)="openFiles()">
                            Open files
                        </a>
                    </th>
                </tr>

                <tr *ngFor="#file of files">
                    <td>
                        <file-row [file]="file"></file-row>
                    </td>
                </tr>
            </tbody>
        </table>
    `,
    providers: [LaputinService, HTTP_PROVIDERS],
    directives: [FileSearchComponent, FileRowComponent]
})
@Injectable()
export class FilesComponent implements OnInit {
    public files: File[] = [];
    private _query: FileQuery = new FileQuery();
    
    constructor(@Inject(LaputinService) private _service: LaputinService) {
    }
    
    ngOnInit(): void {
        this._service.queryFiles(this._query).then((files: File[]) => {
            this.files = files;
        });
    }
    
    filterFiles(query: FileQuery): void {
        this._query = query;
        this._service.queryFiles(query).then((files: File[]) => {
            this.files = files;
        });
    }
    
    openFiles(): void {
        this._service.openFiles(this._query);
    }
}