import {Component, OnInit} from "angular2/core";
import {HTTP_PROVIDERS, Headers} from "angular2/http";
import {Observable} from "rxjs/Rx";

import {File} from "./../models/file";
import {Tag} from "./../models/tag";
import {FileQuery} from "./../models/filequery";
import {LaputinService} from "./../services/laputinservice";
import {TagAutocompleteComponent} from "./tagautocomplete.component";
import {FileRowComponent} from "./file.component";

@Component({
    template: `
        <div class="filter-controls">
            <div class="extra-padded">
                <div class="row">
                    <div class="col-md-4">
                        <form class="form-horizontal">
                            <div class="form-group">
                                <label class="col-sm-2 control-label">Tags</label>
                                <div class="col-sm-10">
                                    <div>
                                        <tag-autocomplete (select)="addTag($event)"></tag-autocomplete>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-2 control-label">Filename</label>
                                <div class="col-sm-10">
                                    <input type="text" class="form-control" [(ngModel)]="query.filename" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-2 control-label">Status</label>
                                <div class="col-sm-10">
                                    <select class="form-control" [(ngModel)]="query.status">
                                        <option value="both">Both tagged and untagged</option>
                                        <option value="untagged">Only untagged</option>
                                        <option value="tagged">Only tagged</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <div class="col-sm-10 col-sm-offset-2">
                                    <p>
                                        <small>
                                            <a (click)="clear()">Clear search filters</a>
                                        </small>
                                    </p>
                                </div>
                            </div>
                            <input type="submit" (click)="submitClicked($event)" />
                        </form>
                    </div>
                    <div class="col-md-7 col-md-offset-1">
                        <div class="tag btn-group" *ngFor="#tag of selectedTags">
                            <button class="dropdown-toggle btn btn-success" type="button" (click)="removeTag(tag)">
                                <span>{{tag.name}}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    
        <table class="table table-striped">
            <tbody>
                <tr>
                    <th>
                        Showing {{matchingFiles.length}} matching files

                        <a class="btn btn-primary pull-right" (click)="openFiles()">
                            Open files
                        </a>
                    </th>
                </tr>

                <tr *ngFor="#file of matchingFiles">
                    <td>
                        <file-row [file]="file"></file-row>
                    </td>
                </tr>
            </tbody>
        </table>
    `,
    providers: [LaputinService, HTTP_PROVIDERS],
    directives: [TagAutocompleteComponent, FileRowComponent]
})
export class FilesComponent implements OnInit {
    public allFiles: File[] = [];
    public matchingFiles: File[] = [];
    
    public tags: Tag[] = [];
    public selectedTags: Tag[] = [];
    
    private filenameMask: string = "";
    private query: FileQuery = new FileQuery();
    
    constructor(private _service: LaputinService) {
    }
    
    ngOnInit(): void {
        this._service.getTags().then((tags: Tag[]) => { this.tags = tags; });
        this._service.queryFiles(this.query).then((files: File[]) => {
            this.allFiles = files;
            this.matchingFiles = files;
        });
    }
    
    submitClicked(event: Event): void {
        event.preventDefault();
        this.filterFiles();
    }
    
    filterFiles(): void {
        this._service.queryFiles(this.query).then((files: File[]) => {
            this.matchingFiles = files;
        });
    }
    
    addTag(tag: Tag): void {
        if (this.selectedTags.indexOf(tag) == -1) {
            this.selectedTags.push(tag);
            this.filterFiles();
        }
    }
    
    removeTag(tag: Tag): void {
        this.selectedTags = this.selectedTags.filter((t) => t.id != tag.id);
        this.filterFiles();
    }
    
    clear(): void {
        this.selectedTags = [];
        this.query.clear();
        this.filterFiles();
    }
    
    openFiles(): void {
        this._service.openFiles(this.matchingFiles);
    }
}