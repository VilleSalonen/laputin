import {Component, Input, Output, EventEmitter} from "angular2/core";
import {Observable} from "rxjs/Rx";

import {File} from "./../models/file";
import {Tag} from "./../models/tag";
import {FileQuery} from "./../models/filequery";
import {TagAutocompleteComponent} from "./tagautocomplete.component";

@Component({
    selector: "file-search",
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
    `,
    directives: [TagAutocompleteComponent]
})
export class FileSearchComponent {
    private query: FileQuery = new FileQuery();
    
    @Output()
    public update: EventEmitter<FileQuery> = new EventEmitter<FileQuery>(); 
    
    public selectedTags: Tag[] = [];
    
    private filenameMask: string = "";
    
    constructor() {
    }
    
    submitClicked(event: Event): void {
        event.preventDefault();
        this.update.emit(this.query);
    }
    
    addTag(tag: Tag): void {
        if (this.selectedTags.indexOf(tag) == -1) {
            this.selectedTags.push(tag);
            this.query.andTag(tag);
            this.update.emit(this.query);
        }
    }
    
    removeTag(tag: Tag): void {
        this.selectedTags = this.selectedTags.filter((t) => t.id != tag.id);
        this.query.removeTag(tag);
        this.update.emit(this.query);
    }
    
    clear(): void {
        this.selectedTags = [];
        this.query.clear();
        this.update.emit(this.query);
    }
}