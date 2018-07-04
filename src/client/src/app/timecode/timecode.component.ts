import {Component, Input, Output, EventEmitter, ElementRef, Injectable, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs/Rx';
import * as _ from 'lodash';
import * as moment from 'moment';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import {File} from './../models/file';
import {Tag, Timecode, TimecodeTag} from './../models/tag';
import {TagContainer} from './../models/tagcontainer';
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
export class TimecodeComponent {
    public AutocompleteType = AutocompleteType;

    @Input() file: File;
    @Input() timecode: Timecode;
    @Input() currentTime: number;
    @Output() removed: EventEmitter<Timecode> = new EventEmitter<Timecode>();

    public addingTags: boolean;

    constructor(private _service: LaputinService, private _playerService: PlayerService) {
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
        result += (milliseconds > 100) ? milliseconds : (milliseconds >= 10) ? '0' + milliseconds : '00' + milliseconds;

        return result;
    }

    public async screenshotTimecode(timecode: Timecode): Promise<void> {
        if (this._playerService.player) {
            await this._service.screenshotTimecode(this.file, timecode, this._playerService.player.currentTime);
            timecode.cacheBuster = '?cachebuster=' + (new Date().toISOString());
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

        this.addingTags = false;
    }

    public async removeTagFromExistingTimecode(timecode: Timecode, timecodeTag: TimecodeTag): Promise<void> {
        await this._service.deleteTimecodeTag(timecode, timecodeTag);

        const timecodeTagsAfterDeletion = timecode.timecodeTags.filter(t => t.timecodeTagId !== timecodeTag.timecodeTagId);
        timecode.timecodeTags = timecodeTagsAfterDeletion;

        if (timecodeTagsAfterDeletion.length === 0) {
            this.removed.next(this.timecode);
        }
    }
}
