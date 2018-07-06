import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs/Rx';

import {File} from './../models/file';
import {Tag, TagStatus} from './../models/tag';
import {FileQuery} from './../models/filequery';
import {TagChange} from './../search-tag/search-tag.component';
import { Subject } from 'rxjs/Subject';
import { AutocompleteType } from '../models/autocompletetype';

@Component({
    selector: 'app-timecode-search',
    styleUrls: ['./timecode-search.component.scss'],
    templateUrl: './timecode-search.component.html',
})
export class TimecodeSearchComponent {
    public query: FileQuery = new FileQuery();

    public AutocompleteType = AutocompleteType;

    @Output()
    public update: EventEmitter<FileQuery> = new EventEmitter<FileQuery>();

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
