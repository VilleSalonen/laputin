import {Component, Input, Output, EventEmitter} from "@angular/core";
import {Observable} from "rxjs/Rx";

import {File} from "./../models/file";
import {Tag, TagStatus} from "./../models/tag";
import {FileQuery} from "./../models/filequery";
import {TagChange} from "./searchtag.component";

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
                                        <tag-autocomplete [tagContainer]="query" (select)="addTag($event)"></tag-autocomplete>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-2 control-label">Filename</label>
                                <div class="col-sm-10">
                                    <input type="text" class="form-control" [(ngModel)]="query.filename" name="filename" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-2 control-label">Status</label>
                                <div class="col-sm-10">
                                    <select class="form-control" [(ngModel)]="query.status" name="status">
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
                        <div class="tag btn-group" *ngFor="let tag of query.tags">
                            <search-tag [tag]="tag" (changed)="changeTag($event)" (removed)="removeTag($event)"></search-tag>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class FileSearchComponent {
    public query: FileQuery = new FileQuery();
    
    @Output()
    public update: EventEmitter<FileQuery> = new EventEmitter<FileQuery>(); 
    
    constructor() {
    }
    
    submitClicked(event: Event): void {
        event.preventDefault();
        this.update.emit(this.query);
    }
    
    addTag(tag: Tag): void {
        this.query.andTag(tag);
        this.update.emit(this.query);
    }

    changeTag(tagChange: TagChange): void {
        if (tagChange.tagStatus == TagStatus.And) {
            this.query.andTag(tagChange.tag);
        } else if (tagChange.tagStatus == TagStatus.Or) {
            this.query.orTag(tagChange.tag);
        } else if (tagChange.tagStatus == TagStatus.Not) {
            this.query.notTag(tagChange.tag);
        }
        this.update.emit(this.query);
    }
    
    removeTag(tag: Tag): void {
        this.query.removeTag(tag);
        this.update.emit(this.query);
    }
    
    clear(): void {
        this.query.clear();
        this.update.emit(this.query);
    }
}