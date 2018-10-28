import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import * as _ from 'lodash';
import * as moment from 'moment';

import {File} from './../models/file';
import { AutocompleteType } from '../models/autocompletetype';
import { Timecode, Tag, TimecodeTag } from '../models/tag';
import { LaputinService } from '../laputin.service';
import { PlayerService } from '../player.service';

export interface TimecodeEditDialogData {
    file: File;
    timecode: Timecode;
}

@Component({
    templateUrl: 'timecode-edit-dialog.component.html',
    styleUrls: ['./timecode-edit-dialog.component.scss'],
})
export class TimecodeEditDialogComponent {
    public AutocompleteType = AutocompleteType;

    public file: File;
    public timecode: Timecode;

    public alreadySelectedTags: Tag[];

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
        const clonedTimecode = _.cloneDeep(this.timecode);
        clonedTimecode.timecodeTags = [
            new TimecodeTag(null, this.timecode.timecodeId, tag)
        ];
        const result = await this._service.createTagTimecode(this.file, clonedTimecode);

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

    public async removeTagFromExistingTimecode(timecodeTag: TimecodeTag): Promise<void> {
        await this._service.deleteTimecodeTag(this.timecode, timecodeTag);

        const timecodeTagsAfterDeletion = this.timecode.timecodeTags.filter(t => t.timecodeTagId !== timecodeTag.timecodeTagId);
        this.timecode.timecodeTags = timecodeTagsAfterDeletion;
    }

    public async setTagStart(): Promise<void> {
        this.timecode.start = this._playerService.getCurrentTime();
        await this._service.updateTimecodeStartAndEnd(this.file, this.timecode);
    }

    public async setTagEnd(): Promise<void> {
        this.timecode.end = this._playerService.getCurrentTime();
        await this._service.updateTimecodeStartAndEnd(this.file, this.timecode);
    }

    close(): void {
        this.dialogRef.close();
    }

    cancel(): void {
        this.dialogRef.close();
    }

    private updateAlreadySelectedTags(): void {
        this.alreadySelectedTags = this.timecode.timecodeTags.map(timecodeTag => timecodeTag.tag);
    }

    public formatTimecodeDuration(): string {
        const duration = moment.duration(this.timecode.end - this.timecode.start, 'seconds');

        let result = '';

        const minutes = Math.floor(duration.asMinutes());
        const seconds = duration.seconds();

        if (minutes > 0) {
            result += minutes + ' min ';
        }
        if (seconds > 0) {
            result += seconds + ' sec';
        }

        return result.trim();
    }

    public formatPreciseDuration(durationInSeconds: number): string {
        const duration = moment.duration(durationInSeconds, 'seconds');

        let result = '';

        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        const milliseconds = parseInt(duration.milliseconds().toFixed(0), 10);

        result += ((hours >= 10) ? hours : '0' + hours);
        result += ':';
        result += (minutes >= 10) ? minutes : '0' + minutes;
        result += ':';
        result += (seconds >= 10) ? seconds : '0' + seconds;
        result += '.';
        result += (milliseconds >= 100) ? milliseconds : (milliseconds >= 10) ? '0' + milliseconds : '00' + milliseconds;

        return result;
    }
}
