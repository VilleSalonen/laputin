import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs/Rx';

import {File} from './../models/file';
import {Tag, TagStatus} from './../models/tag';
import {FileQuery} from './../models/filequery';
import {TagChange} from './../search-tag/search-tag.component';

@Component({
    selector: 'app-file-search',
    styleUrls: ['./file-search.component.scss'],
    template: `
        <form class="row">
            <div class="row control">
                <label>Tags</label>
                <app-tag-autocomplete [tagContainer]="query" (select)="addTag($event)"></app-tag-autocomplete>
            </div>

            <div class="row control">
                <label>Filename</label>
                <input type="text" class="form-control" [(ngModel)]="query.filename" name="filename" />
            </div>

            <div class="row control">
                <label>Status</label>
                <select class="form-control" [ngModel]="query.status"
                    (ngModelChange)="onStatusChanged($event)" name="status">
                    <option value="both">Both tagged and untagged</option>
                    <option value="untagged">Only untagged</option>
                    <option value="tagged">Only tagged</option>
                </select>
            </div>

            <div class="control">
                <button (click)="clear()">Clear search filters</button>
            </div>

            <input type="submit" style="display: none;" (click)="submitClicked($event)" />
        </form>

        <div class="tag btn-group" *ngFor="let tag of query.tags">
            <app-search-tag [tag]="tag" (changed)="changeTag($event)" (removed)="removeTag($event)"></app-search-tag>
        </div>
    `
})
export class FileSearchComponent {
    public query: FileQuery = new FileQuery();

    @Output()
    public update: EventEmitter<FileQuery> = new EventEmitter<FileQuery>();

    constructor() {
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
