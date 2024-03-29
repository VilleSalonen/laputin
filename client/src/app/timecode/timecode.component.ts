import {
    Component,
    Input,
    Output,
    EventEmitter,
    Injectable,
    ChangeDetectionStrategy,
    OnInit
} from '@angular/core';

import { File, Timecode, Tag } from './../models';
import { LaputinService } from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';
import { PlayerService } from '../player.service';
import { TimecodeEditDialogComponent } from '../timecode-edit-dialog/timecode-edit-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-timecode',
    styleUrls: ['./timecode.component.scss'],
    templateUrl: './timecode.component.html',
    providers: [LaputinService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
@Injectable()
export class TimecodeComponent implements OnInit {
    public AutocompleteType = AutocompleteType;

    @Input() file: File;
    @Input() timecode: Timecode;
    @Input() currentTime: number;
    @Output() removed: EventEmitter<Timecode> = new EventEmitter<Timecode>();
    @Output() tagsCopied: EventEmitter<Tag[]> = new EventEmitter<Tag[]>();

    public cacheBuster = '';

    constructor(
        private _service: LaputinService,
        private _playerService: PlayerService,
        private editDialog: MatDialog
    ) {}

    public ngOnInit() {
        this._service.timecodeThumbnailChanged.subscribe(
            (changed: Timecode) => {
                if (changed.timecodeId === this.timecode.timecodeId) {
                    this.cacheBuster =
                        '?cachebuster=' + new Date().toISOString();
                }
            }
        );
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

    public async screenshotTimecode(): Promise<void> {
        if (this._playerService.player) {
            await this._service
                .screenshotTimecode(
                    this.file,
                    this.timecode,
                    this._playerService.player.currentTime
                )
                .toPromise();
        }
    }

    public goToTimecode(): void {
        this.goToTimecodeStart();
        this._playerService.play();
    }

    public goToTimecodeStart(): void {
        this._playerService.setCurrentTime(this.timecode.start);
    }

    public goToTimecodeEnd(): void {
        this._playerService.setCurrentTime(this.timecode.end);
    }

    public formattedTags(): string {
        return this.timecode.timecodeTags
            .sort((a, b) => (a.tag.name > b.tag.name ? 1 : -1))
            .map(timecodeTag => timecodeTag.tag.name)
            .join(', ');
    }

    public copyTags(): void {
        this.tagsCopied.emit(this.timecode.timecodeTags.map(t => t.tag));
    }
}
