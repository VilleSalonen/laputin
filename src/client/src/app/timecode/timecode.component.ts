import {Component, Input, Output, EventEmitter, Injectable, OnInit} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import {File} from './../models/file';
import {Tag, Timecode, TimecodeTag} from './../models/tag';
import {LaputinService} from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';
import { PlayerService } from '../player.service';

@Component({
    selector: 'app-timecode',
    styleUrls: ['./timecode.component.scss'],
    templateUrl: './timecode.component.html',
    providers: [LaputinService]
})
@Injectable()
export class TimecodeComponent implements OnInit {
    public AutocompleteType = AutocompleteType;

    @Input() file: File;
    @Input() timecode: Timecode;
    @Input() currentTime: number;
    @Output() removed: EventEmitter<Timecode> = new EventEmitter<Timecode>();

    public showControls: boolean;
    public alreadySelectedTags: Tag[];
    public editing: boolean;

    constructor(private _service: LaputinService, private _playerService: PlayerService) {
    }

    ngOnInit() {
        this.updateAlreadySelectedTags();
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

    public toggleEdit(): void {
        this.editing = !this.editing;
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

    public async screenshotTimecode(): Promise<void> {
        if (this._playerService.player) {
            await this._service.screenshotTimecode(this.file, this.timecode, this._playerService.player.currentTime);
            this.timecode.cacheBuster = '?cachebuster=' + (new Date().toISOString());
        }
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

        if (timecodeTagsAfterDeletion.length === 0) {
            this.removed.next(this.timecode);
        }
    }

    public goToTimecode(): void {
        this._playerService.setCurrentTime(this.timecode.start);
        this._playerService.play();
    }

    public goToTimecodeStart(): void {
        this._playerService.setCurrentTime(this.timecode.start);
    }

    public goToTimecodeEnd(): void {
        this._playerService.setCurrentTime(this.timecode.end);
    }

    private updateAlreadySelectedTags(): void {
        this.alreadySelectedTags = this.timecode.timecodeTags.map(timecodeTag => timecodeTag.tag);
    }

    public formattedTags(): string {
        return _.map(this.timecode.timecodeTags, (timecodeTag) => timecodeTag.tag.name).join(', ');
    }
}
