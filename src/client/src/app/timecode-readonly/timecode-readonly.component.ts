import {Component, Input, Output, EventEmitter, Injectable} from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import {File} from './../models/file';
import { AutocompleteType } from '../models/autocompletetype';
import { PlayerService } from '../player.service';
import { Timecode, TimecodeTag } from '../models';

@Component({
    selector: 'app-timecode-readonly',
    styleUrls: ['./timecode-readonly.component.scss'],
    templateUrl: './timecode-readonly.component.html'
})
@Injectable()
export class TimecodeReadonlyComponent {
    public AutocompleteType = AutocompleteType;

    @Input() file: File;
    @Input() timecode: Timecode;
    @Input() currentTime: number;
    @Output() removed: EventEmitter<Timecode> = new EventEmitter<Timecode>();

    public addingTags: boolean;

    constructor(private _playerService: PlayerService) {
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

    public goToTimecode(timecode: Timecode): void {
        this._playerService.setCurrentTime(timecode.start);
        this._playerService.play();
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

    public formattedTags(): string {
        return _
            .sortBy(this.timecode.timecodeTags, [(t: TimecodeTag) => t.tag.name])
            .map((timecodeTag) => timecodeTag.tag.name)
            .join(', ');
    }
}
