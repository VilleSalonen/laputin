import {Component, OnInit} from "angular2/core";
import {HTTP_PROVIDERS, Headers} from "angular2/http";
import {Observable} from "rxjs/Rx";

import {File} from "./file";
import {Tag} from "./tag";
import {LaputinService} from "./laputinservice";
import {SearchBox} from "./searchbox.component";
import {FileNamePipe} from "./filenamepipe";
import {TagAutocompleteComponent} from "./tagautocomplete.component";

@Component({
    pipes: [FileNamePipe],
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
                                    <search-box (update)="termChanged($event)"></search-box>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-2 control-label">Status</label>
                                <div class="col-sm-10">
                                    <select class="form-control">
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
                                            <a>Clear search filters</a>
                                        </small>
                                    </p>
                                </div>
                            </div>
                            <input type="submit" class="submit-hack">
                        </form>
                    </div>
                    <div class="col-md-7 col-md-offset-1">
                        <div class="tag btn-group" *ngFor="#tag of selectedTags">
                            <button class="dropdown-toggle btn btn-success" type="button">
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

                        <a class="btn btn-primary pull-right">
                            Open files
                        </a>
                    </th>
                </tr>

                <tr *ngFor="#file of matchingFiles">
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
    directives: [SearchBox, TagAutocompleteComponent]
})
export class FilesComponent implements OnInit {
    public allFiles: File[] = [];
    public matchingFiles: File[] = [];
    
    public tags: Tag[] = [];
    public selectedTags: Tag[] = [];
    
    constructor(private _service: LaputinService) {
    }
    
    ngOnInit(): void {
        this._service.tags.subscribe((tags: Tag[]) => { this.tags = tags; });
        this._service.files.subscribe((files: File[]) => {
            this.allFiles = files;
            this.matchingFiles = files;
        });
    }
    
    termChanged(term: string): void {
        if (term.length == 0) {
            this.matchingFiles = this.allFiles;
            return;
        }
        
        var that = this;
        var termLowered = term.toLowerCase();
        this.matchingFiles = this.allFiles
            .filter(file => file.path.toLowerCase().includes(termLowered))
            .filter(file => {
                return that.selectedTags.every(value => file.tags.map(tag => tag.id).indexOf(value.id) > -1);
            });
    }
    
    addTag(tag: Tag): void {
        if (this.selectedTags.indexOf(tag) == -1) {
            this.selectedTags.push(tag);
        }
    }
    
    onSelect(file: File): void {
        this._service.openFile(file);
    }
}