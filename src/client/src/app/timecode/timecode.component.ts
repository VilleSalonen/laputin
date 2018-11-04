import {Component, Input, Output, EventEmitter, Injectable} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import {File} from './../models/file';
import {Timecode, TimecodeTag} from './../models/tag';
import {LaputinService} from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';
import { PlayerService } from '../player.service';
import { TimecodeEditDialogComponent } from '../timecode-edit-dialog/timecode-edit-dialog.component';
import { MatDialog } from '@angular/material';

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

    constructor(private _service: LaputinService, private _playerService: PlayerService, private editDialog: MatDialog) {
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

    public edit(): void {
        const dialogRef = this.editDialog.open(TimecodeEditDialogComponent, {
            width: '500px',
            data: {
                file: this.file,
                timecode: this.timecode
            }
        });

        dialogRef.afterClosed().subscribe(() => {
            if (this.timecode.timecodeTags.length === 0) {
                this.removed.next(this.timecode);
            }
        });
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

    public formattedTags(): string {
        return _
            .sortBy(this.timecode.timecodeTags, [(t: TimecodeTag) => t.tag.name])
            .map((timecodeTag) => timecodeTag.tag.name)
            .join(', ');
    }
}
