import {Component, Input, Output, EventEmitter, Injectable} from '@angular/core';
import * as _ from 'lodash';

import {File} from './../models/file';
import { AutocompleteType } from '../models/autocompletetype';
import { PlayerService } from '../player.service';
import { Timecode, TimecodeTag } from '../models';
import { Utils } from '../utils';

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

    public formatTimecodeDuration = Utils.formatTimecodeDuration;

    constructor(private _playerService: PlayerService) {
    }

    public goToTimecode(timecode: Timecode): void {
        this._playerService.setCurrentTime(timecode.start);
        this._playerService.play();
    }

    public formattedTags(): string {
        return _
            .sortBy(this.timecode.timecodeTags, [(t: TimecodeTag) => t.tag.name])
            .map((timecodeTag) => timecodeTag.tag.name)
            .join(', ');
    }
}
