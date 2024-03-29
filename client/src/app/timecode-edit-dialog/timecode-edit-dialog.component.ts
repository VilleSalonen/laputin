import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { File, Timecode, Tag, TimecodeTag } from './../models';
import { AutocompleteType } from '../models/autocompletetype';
import { LaputinService } from '../laputin.service';
import { PlayerService } from '../player.service';

export interface TimecodeEditDialogData {
    file: File;
    timecode: Timecode;
}

@Component({
    templateUrl: 'timecode-edit-dialog.component.html',
    styleUrls: ['./timecode-edit-dialog.component.scss']
})
export class TimecodeEditDialogComponent {
    public AutocompleteType = AutocompleteType;

    public file: File;
    public timecode: Timecode;

    public timecodeTags: { tags: Tag[] } = { tags: [] };

    constructor(
        public dialogRef: MatDialogRef<TimecodeEditDialogData>,
        @Inject(MAT_DIALOG_DATA) data: TimecodeEditDialogData,
        private _service: LaputinService,
        private _playerService: PlayerService
    ) {
        this.file = data.file;
        this.timecode = data.timecode;

        this.updateAlreadySelectedTags();
    }

    public async addTagSelectionToTimecode(tag: Tag): Promise<void> {
        const clonedTimecode = JSON.parse(JSON.stringify(this.timecode));
        clonedTimecode.timecodeTags = [
            new TimecodeTag(null, this.timecode.timecodeId, tag)
        ];
        const result = await this._service
            .createTagTimecode(this.file, clonedTimecode)
            .toPromise();

        const timecodeTags = this.timecode.timecodeTags.slice();
        timecodeTags.push(result.timecodeTags[0]);
        timecodeTags.sort((a, b) => {
            if (a.tag.name < b.tag.name) {
                return -1;
            } else if (a.tag.name > b.tag.name) {
                return 1;
            } else {
                return 0;
            }
        });
        this.timecode.timecodeTags = timecodeTags;
        this.updateAlreadySelectedTags();
    }

    public async removeTagFromExistingTimecode(tag: Tag): Promise<void> {
        const timecodeTag = this.timecode.timecodeTags.find(
            t => t.tag.id === tag.id
        );

        if (timecodeTag) {
            await this._service
                .deleteTimecodeTag(this.timecode, timecodeTag)
                .toPromise();

            const timecodeTagsAfterDeletion = this.timecode.timecodeTags.filter(
                t => t.timecodeTagId !== timecodeTag.timecodeTagId
            );
            this.timecode.timecodeTags = timecodeTagsAfterDeletion;
            this.updateAlreadySelectedTags();
        }
    }

    public async setTagStart(): Promise<void> {
        this.timecode.start = this._playerService.getCurrentTime();
        await this._service
            .updateTimecodeStartAndEnd(this.file, this.timecode)
            .toPromise();
    }

    public async setTagEnd(): Promise<void> {
        this.timecode.end = this._playerService.getCurrentTime();
        await this._service
            .updateTimecodeStartAndEnd(this.file, this.timecode)
            .toPromise();
    }

    close(): void {
        this.dialogRef.close();
    }

    cancel(): void {
        this.dialogRef.close();
    }

    private updateAlreadySelectedTags(): void {
        this.timecodeTags.tags = this.timecode.timecodeTags.map(
            timecodeTag => timecodeTag.tag
        );
    }
}
