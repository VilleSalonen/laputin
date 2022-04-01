import {
    Component,
    Input,
    Output,
    EventEmitter,
    Injectable,
    OnInit
} from '@angular/core';

import { File } from '../models/file';
import { AutocompleteType } from '../models/autocompletetype';
import { PlayerService } from '../player.service';
import { Timecode } from '../models';
import { LaputinService } from '../laputin.service';

@Component({
    selector: 'app-timecode-mobile-readonly',
    styleUrls: ['./timecode-mobile-readonly.component.scss'],
    templateUrl: './timecode-mobile-readonly.component.html'
})
@Injectable()
export class TimecodeMobileReadonlyComponent implements OnInit {
    public AutocompleteType = AutocompleteType;

    @Input() file: File;
    @Input() timecode: Timecode;
    @Input() currentTime: number;
    @Output() removed: EventEmitter<Timecode> = new EventEmitter<Timecode>();

    public addingTags: boolean;
    public cacheBuster: string;

    constructor(
        private _playerService: PlayerService,
        private laputinService: LaputinService
    ) {}

    public ngOnInit() {
        this.laputinService.timecodeThumbnailChanged.subscribe(
            (changed: Timecode) => {
                if (changed.timecodeId === this.timecode.timecodeId) {
                    this.cacheBuster =
                        '?cachebuster=' + new Date().toISOString();
                }
            }
        );
    }

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
