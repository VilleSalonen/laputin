import { Component, Output, EventEmitter } from '@angular/core';

import { Tag, AutocompleteType, FileQuery } from '../models';

@Component({
    selector: 'app-timecode-search',
    styleUrls: ['./timecode-search.component.scss'],
    templateUrl: './timecode-search.component.html'
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
        if (tag instanceof Event) {
            return;
        }

        this.query.andTag(tag);
        this.update.emit(this.query);
    }

    removeTag(tag: Tag): void {
        this.query.removeTag(tag);
        this.update.emit(this.query);
    }
}
