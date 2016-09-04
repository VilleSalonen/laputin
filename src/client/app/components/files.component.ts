import {Component, OnInit, Injectable, Inject} from "@angular/core";
import {Observable} from "rxjs/Rx";

import {File} from "./../models/file";
import {Tag} from "./../models/tag";
import {FileQuery} from "./../models/filequery";
import {LaputinService} from "./../services/laputinservice";

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

                <tr [hidden]="!loading" class="loading">
                    <td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>
                </tr>

                <tr *ngFor="let file of files">
                    <td>
                        <file-row [file]="file"></file-row>
                    </td>
                </tr>
            </tbody>
        </table>
    `,
    providers: [LaputinService]
})
@Injectable()
export class FilesComponent implements OnInit {
    public files: File[] = [];
    public loading: boolean = false;
    private _query: FileQuery = new FileQuery();
    
    constructor(@Inject(LaputinService) private _service: LaputinService) {
    }
    
    ngOnInit(): void {
        this.loadFiles();
    }
    
    filterFiles(query: FileQuery): void {
        this._query = query;
        this.loadFiles();
    }
    
    openFiles(): void {
        this._service.openFiles(this._query);
    }

    loadFiles(): void {
        this.files = [];
        this.loading = true;
        this._service.queryFiles(this._query).then((files: File[]) => {
            this.files = files;
            this.loading = false;
        });
    }
}