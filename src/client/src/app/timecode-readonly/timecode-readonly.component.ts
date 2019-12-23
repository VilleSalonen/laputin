import {
    Component,
    Input,
    Output,
    EventEmitter,
    Injectable
} from '@angular/core';

import { File } from './../models/file';
import { AutocompleteType } from '../models/autocompletetype';
import { PlayerService } from '../player.service';
import { Timecode } from '../models';

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

    constructor(private _playerService: PlayerService) {}

    public goToTimecode(timecode: Timecode): void {
        this._playerService.setCurrentTime(timecode.start);
        this._playerService.play();
    }

    public formattedTags(): string {
        return this.timecode.timecodeTags
            .sort((a, b) => (a.tag.name > b.tag.name ? 1 : -1))
            .map(timecodeTag => timecodeTag.tag.name)
            .join(', ');
    }
}
