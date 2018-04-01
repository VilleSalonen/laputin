import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs/Rx';

import {File} from './../models/file';
import {Tag, TagStatus} from './../models/tag';
import {FileQuery} from './../models/filequery';
import {TagChange} from './../search-tag/search-tag.component';
import { Subject } from "rxjs/Subject";

@Component({
    selector: 'app-file-search',
    styleUrls: ['./file-search.component.scss'],
    template: `
        <form (ngSubmit)="submitClicked($event)">
            <div class="control">
                <app-tag-autocomplete [tagContainer]="query" (select)="addTag($event)"></app-tag-autocomplete>
            </div>

            <div class="control">
                <input type="text" class="form-control" [ngModel]="query.filename" (ngModelChange)="onFilenameChanged($event)"
                    name="filename" placeholder="Filename" />
            </div>

            <div class="control">
                <select class="form-control" [ngModel]="query.status"
                    (ngModelChange)="onStatusChanged($event)" name="status">
                    <option value="both">All</option>
                    <option value="untagged">Only untagged</option>
                    <option value="tagged">Only tagged</option>
                </select>
            </div>

            <div class="control">
                <a (click)="clear()">Clear search filters</a>
            </div>

            <div class="control">
                <input type="submit" style="display: none;" (click)="submitClicked($event)" />
            </div>
        </form>

        <div class="tag btn-group" *ngFor="let tag of query.tags">
            <app-search-tag [tag]="tag" (changed)="changeTag($event)" (removed)="removeTag($event)"></app-search-tag>
        </div>
    `
})
export class FileSearchComponent {
    public query: FileQuery = new FileQuery();
    private filenameChanged: Subject<string> = new Subject<string>();

    @Output()
    public update: EventEmitter<FileQuery> = new EventEmitter<FileQuery>();

    constructor() {
        this.filenameChanged
            .debounceTime(300)
            .distinctUntilChanged()
            .subscribe(model => {
                this.query.filename = model;
                this.update.emit(this.query);
            });
    }

    onFilenameChanged(newFilename: string): void {
        this.filenameChanged.next(newFilename);
    }

    onStatusChanged(newStatus: string): void {
        this.query.status = newStatus;
        this.update.emit(this.query);
    }

    submitClicked(event: Event): void {
        event.preventDefault();
        this.update.emit(this.query);
    }

    addTag(tag: Tag): void {
        // For some reason normal Event objects are sometimes passed to this
        // method. That triggers tag selection.
        //
        // To get rid of such problematic selections, check type.
        if (tag instanceof Event) { return; }

        this.query.andTag(tag);
        this.update.emit(this.query);
    }

    changeTag(tagChange: TagChange): void {
        if (tagChange.tagStatus === TagStatus.And) {
            this.query.andTag(tagChange.tag);
        } else if (tagChange.tagStatus === TagStatus.Or) {
            this.query.orTag(tagChange.tag);
        } else if (tagChange.tagStatus === TagStatus.Not) {
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
