import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { File } from './../models/file';
import { AutocompleteType } from '../models/autocompletetype';
import { Tag } from '../models/tag';

export interface TagScreenshotDialogData {
    file: File;
    tag: Tag;
}

@Component({
    selector: 'app-tag-screenshot-dialog',
    templateUrl: 'tag-screenshot-dialog.component.html'
})
export class TagScreenshotDialogComponent {
    public AutocompleteType = AutocompleteType;

    public selectedTag: { tags: Tag[] } = { tags: [] };

    constructor(
        public dialogRef: MatDialogRef<TagScreenshotDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: TagScreenshotDialogData
    ) {}

    selectScreenshotTag(tag: Tag) {
        this.data.tag = tag;
        this.dialogRef.close(tag);
    }

    cancel(): void {
        this.dialogRef.close();
    }
}
