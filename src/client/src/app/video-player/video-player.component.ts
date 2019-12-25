import {
    Component,
    Input,
    Output,
    EventEmitter,
    Injectable,
    ViewChild,
    ElementRef,
    AfterViewInit,
    OnDestroy
} from '@angular/core';

import {
    File,
    FileQuery,
    FileChange,
    ChangeDirection,
    Tag,
    Timecode,
    TimecodeTag,
    AutocompleteType
} from './../models';
import { LaputinService } from './../laputin.service';
import { PlayerService } from '../player.service';
import { MatSliderChange, MatDialog } from '@angular/material';
import { TagScreenshotDialogComponent } from '../tag-screenshot-dialog/tag-screenshot-dialog.component';
import { fromEvent, merge, of } from 'rxjs';
import {
    takeUntil,
    throttleTime,
    map,
    delay,
    switchMap,
    distinctUntilChanged
} from 'rxjs/operators';
import { formatPreciseDuration } from '../pipes/precise-duration.pipe';

@Component({
    selector: 'app-video-player',
    styleUrls: ['./video-player.component.scss'],
    templateUrl: './video-player.component.html'
})
@Injectable()
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
    public playbackHasBeenStarted: boolean;
    public showScreenshotPreview: boolean;
    public playing: boolean;
    public random: boolean;
    public progressText: string;
    public resolution: string;
    public isFullScreen: boolean;
    public cacheBuster = '';

    public tagCreationOpen = false;
    public AutocompleteType = AutocompleteType;

    public mouseOverVideo: boolean;

    private player: HTMLVideoElement;

    private duration: string;

    @ViewChild('playerView', { static: false }) playerView: ElementRef;
    @ViewChild('videoArea', { static: false }) videoArea: ElementRef;
    @ViewChild('player', { static: false }) playerElem: ElementRef;
    @ViewChild('slider', { static: false }) sliderElem: ElementRef;
    @ViewChild('volume', { static: false }) volumeSliderElem: ElementRef;

    private _file: File;

    @Input()
    get file(): File {
        return this._file;
    }
    set file(value: File) {
        this._file = value;

        this._service.proxyExists(this.file).subscribe(proxyExists => {
            if (proxyExists) {
                this.videoSource = `/proxies/${this.file.hash}.mp4`;
            } else {
                this.videoSource = `/media/${this.file.escapedUrl}`;
            }
        });
    }

    public timecodes: Timecode[] = [];
    public selectedTagsForTimecode: Tag[] = [];
    public tagStart: string;
    public tagEnd: string;

    public sliderMin = 0;
    public sliderMax = 1000000;
    public sliderValue: number;

    public volumeMin = 0;
    public volumeMax = 100;
    public volumeValue = 100;

    public videoSource: string;

    @Output()
    public fileChange: EventEmitter<FileChange> = new EventEmitter<
        FileChange
    >();
    @Output()
    public fileClosed: EventEmitter<void> = new EventEmitter<void>();

    constructor(
        private _service: LaputinService,
        private _playerService: PlayerService,
        private dialog: MatDialog
    ) {}

    public ngAfterViewInit(): void {
        this.player = this.playerElem.nativeElement;
        this._playerService.setPlayer(this.player);

        const playStart = fromEvent(this.player, 'playing').pipe(
            takeUntil(this.fileClosed)
        );
        const paused = fromEvent(this.player, 'pause').pipe(
            takeUntil(this.fileClosed)
        );
        const ended = fromEvent(this.player, 'ended').pipe(
            takeUntil(this.fileClosed)
        );
        const playEnd = merge(paused, ended);

        const playerDoubleClicked = fromEvent(this.player, 'dblclick').pipe(
            takeUntil(this.fileClosed)
        );
        playerDoubleClicked.subscribe(() => this.toggleFullScreen());

        playStart.subscribe(() => (this.playing = true));
        playEnd.subscribe(() => (this.playing = false));

        playStart.subscribe(() => (this.playbackHasBeenStarted = true));

        const timeUpdates = fromEvent(this.player, 'timeupdate').pipe(
            takeUntil(this.fileClosed),
            throttleTime(500),
            map(() => this.player.currentTime / this.player.duration)
        );

        timeUpdates.subscribe((playPercent: number) =>
            this.updateProgress(playPercent)
        );

        // Force progress update when video is changed or seeked.
        // Without forced update, these changes will be seen with a
        // delay.
        fromEvent(this.player, 'durationchange')
            .pipe(takeUntil(this.fileClosed))
            .subscribe(() => {
                this._service
                    .getTimecodes(this.file)
                    .toPromise()
                    .then(timecodes => {
                        this.timecodes = timecodes;
                    });

                this.playbackHasBeenStarted = false;
                this.playing = false;
                this.duration = this.formatDuration(this.player.duration);
                this.updateProgress(0);

                if (this.player.videoWidth && this.player.videoHeight) {
                    this.resolution =
                        this.player.videoWidth + 'x' + this.player.videoHeight;
                }
            });

        fromEvent(window, 'webkitfullscreenchange')
            .pipe(takeUntil(this.fileClosed))
            .subscribe(() => {
                this.isFullScreen = !this.isFullScreen;

                if (this.isFullScreen) {
                    this.playerElem.nativeElement.focus();
                }

                // We have to reset playhead because it might be further right than
                // the new timeline width allows.
                this.setPlayheadTo(0);
                this.updateProgress(
                    this.player.currentTime / this.player.duration
                );
            });

        const windowKeyups = fromEvent(window, 'keyup').pipe(
            takeUntil(this.fileClosed)
        );

        const mouseEnter = fromEvent(
            this.videoArea.nativeElement,
            'mouseenter'
        );
        const mouseMove = fromEvent(this.videoArea.nativeElement, 'mousemove');
        const afterMouseMove = mouseMove.pipe(
            map(ev => of(ev).pipe(delay(2000))),
            switchMap(flatten => flatten)
        );
        const mouseLeave = fromEvent(
            this.videoArea.nativeElement,
            'mouseleave'
        );

        const starts = merge(mouseEnter, mouseMove).pipe(map(() => 'start'));
        const ends = merge(afterMouseMove, mouseLeave).pipe(map(() => 'end'));
        merge(starts, ends)
            .pipe(distinctUntilChanged(), takeUntil(this.fileClosed))
            .subscribe(val => {
                if (val === 'start') {
                    this.mouseOverVideo = true;
                } else {
                    this.mouseOverVideo = false;
                }
            });

        windowKeyups.subscribe((event: KeyboardEvent) => {
            if ((<any>event.srcElement).nodeName === 'INPUT') {
                if (event.key === 'Escape') {
                    (<any>event.srcElement).blur();
                }

                return;
            }

            switch (event.key) {
                case 'PageUp':
                    this.megaStepForward();
                    break;
                case 'PageDown':
                    this.megaStepBackward();
                    break;
                case 'ArrowLeft':
                    if (event.shiftKey) {
                        this.tinyStepBackward();
                    } else {
                        this.largeStepBackward();
                    }
                    break;
                case 'ArrowRight':
                    if (event.shiftKey) {
                        this.tinyStepForward();
                    } else {
                        this.largeStepForward();
                    }
                    break;
                case 'ArrowUp':
                    if (event.shiftKey) {
                        this.smallStepForward();
                    } else {
                        this.hugeStepForward();
                    }
                    break;
                case 'ArrowDown':
                    if (event.shiftKey) {
                        this.smallStepBackward();
                    } else {
                        this.hugeStepBackward();
                    }
                    break;
                case 'Enter':
                    if (event.altKey) {
                        this.toggleFullScreen();
                    }
                    break;
                case 'Escape':
                    if (this.isFullScreen) {
                        this.toggleFullScreen();
                    }
                    break;
                case ' ':
                    if (this.playing) {
                        this.pause();
                    } else {
                        this.play();
                    }
                    break;
                case 'a':
                    this.goToPrevious();
                    break;
                case 'd':
                    this.goToNext();
                    break;
                case 'q':
                    if (event.shiftKey) {
                        this.goToTagStart();
                    } else {
                        this.setTagStart();
                    }
                    break;
                case 'e':
                    if (event.shiftKey) {
                        this.goToTagEnd();
                    } else {
                        this.setTagEnd();
                    }
                    break;
                case 's':
                    this.toggleRandom();
                    break;
                case 'PrintScreen':
                    this.screenshot();
                    break;
            }
        });
    }

    ngOnDestroy(): void {
        this.close();
    }

    public setProgress(sliderChangeEvent: MatSliderChange) {
        const playPercent = sliderChangeEvent.value / this.sliderMax;

        const newTime = this.player.duration * playPercent;
        if (
            !isNaN(newTime) &&
            0 <= newTime &&
            newTime <= this.player.duration
        ) {
            this.setCurrentTime(newTime);
        }
    }

    public setVolume(sliderChangeEvent: MatSliderChange) {
        const volumePercent = sliderChangeEvent.value / this.volumeMax;
        this.player.volume = volumePercent;

        if (this.volumeSliderElem && this.volumeSliderElem.nativeElement) {
            this.volumeSliderElem.nativeElement.blur();
        }
    }

    private updateProgress(playPercent: number) {
        this.setPlayheadTo(playPercent);
        this.updateTime();

        if (this.sliderElem && this.sliderElem.nativeElement) {
            this.sliderElem.nativeElement.blur();
        }
    }

    private updateTime(): void {
        const currentTime = this.formatDuration(this.player.currentTime);

        if (
            currentTime.indexOf('NaN') === -1 &&
            this.duration &&
            this.duration.indexOf('NaN') === -1
        ) {
            this.progressText = currentTime + '/' + this.duration;
        } else {
            this.progressText = '00:00/00:00';
        }
    }

    private formatDuration(secondsWithDecimals: number): string {
        // Pad to 2 or 3 digits, default is 2
        function pad(n: number, z?: number) {
            z = z || 2;
            return ('00' + n).slice(-z);
        }

        let milliseconds = secondsWithDecimals * 1000;

        const ms = milliseconds % 1000;
        milliseconds = (milliseconds - ms) / 1000;
        const secs = milliseconds % 60;
        milliseconds = (milliseconds - secs) / 60;
        const mins = milliseconds % 60;
        const hrs = (milliseconds - mins) / 60;

        return pad(hrs) + ':' + pad(mins) + ':' + pad(secs);
    }

    private setPlayheadTo(playPercent: number) {
        this.sliderValue = playPercent * this.sliderMax;
    }

    public close(): void {
        this.fileClosed.emit();
    }

    public play(): void {
        this.player.play();
    }

    public pause(): void {
        this.player.pause();
    }

    public largeStepBackward(): void {
        this.setCurrentTime(this.player.currentTime - 10);
    }

    public hugeStepBackward(): void {
        this.setCurrentTime(this.player.currentTime - 60);
    }

    public megaStepBackward(): void {
        this.setCurrentTime(this.player.currentTime - 600);
    }

    public largeStepForward(): void {
        this.setCurrentTime(this.player.currentTime + 10);
    }

    public hugeStepForward(): void {
        this.setCurrentTime(this.player.currentTime + 60);
    }

    public megaStepForward(): void {
        this.setCurrentTime(this.player.currentTime + 600);
    }

    public smallStepBackward(): void {
        this.setCurrentTime(this.player.currentTime - 1 / 4.0);
    }

    public tinyStepBackward(): void {
        this.setCurrentTime(this.player.currentTime - 1 / 20.0);
    }

    public tinyStepForward(): void {
        this.setCurrentTime(this.player.currentTime + 1 / 20.0);
    }

    public smallStepForward(): void {
        this.setCurrentTime(this.player.currentTime + 1 / 4.0);
    }

    public goToPrevious(): void {
        this.emitChange(ChangeDirection.Previous);
    }

    public goToNext(): void {
        this.emitChange(ChangeDirection.Next);
    }

    public toggleFullScreen(): void {
        if (this.isFullScreen) {
            (<any>document).webkitExitFullscreen();
        } else {
            this.playerView.nativeElement.webkitRequestFullScreen();
        }
    }

    public toggleRandom(): void {
        this.random = !this.random;
    }

    private emitChange(direction: ChangeDirection): void {
        this.fileChange.emit(new FileChange(this.file, direction, this.random));
        this.playing = false;
    }

    public toggleTagCreation(): void {
        this.tagCreationOpen = !this.tagCreationOpen;
    }

    public addTag(tag: Tag): void {
        this.addTags([tag]);
    }

    public addTags(tags: Tag[]): void {
        this._service
            .addTags(this.file, tags)
            .subscribe(() => this.addTagsToFile(tags));
    }

    public removeTag(tag: Tag): void {
        this.file.tags = this.file.tags.filter(
            (t: Tag): boolean => t.id !== tag.id
        );
        this._service.deleteTagFileAssoc(this.file, tag).subscribe(() => {});
    }

    private addTagsToFile(tags: Tag[]): void {
        const currentTags = this.file.tags;
        tags.forEach((tag: Tag) => currentTags.push(tag));
        const sorted = currentTags.sort((a, b) => (a.name > b.name ? 1 : -1));
        this.file.tags = sorted;
    }

    public openFile(): void {
        const query = new FileQuery();
        query.hash = this.file.hash;

        this._service.openFiles(query);
    }

    public screenshot(): void {
        this._service
            .screenshotFile(this.file, this.player.currentTime)
            .toPromise()
            .then(() => {
                // Allow for a some delay because user only see this thumbnail when she changes to another file and then back.
                this.cacheBuster = '?cachebuster=' + new Date().toISOString();
                this.showScreenshotPreview = true;

                setTimeout(() => (this.showScreenshotPreview = false), 3000);
            });
    }

    public async screenshotTimecode(timecode: Timecode): Promise<void> {
        await this._service.screenshotTimecode(
            this.file,
            timecode,
            this.player.currentTime
        );
        timecode.cacheBuster = '?cachebuster=' + new Date().toISOString();
    }

    public openTagScreenshotDialog(): void {
        const dialogRef = this.dialog.open(TagScreenshotDialogComponent, {
            width: '500px',
            data: {
                file: this.file
            }
        });

        dialogRef.afterClosed().subscribe(tag => {
            if (tag) {
                this._service
                    .screenshotTag(tag, this.file, this.player.currentTime)
                    .toPromise();
            }
        });
    }

    public copy(): void {
        localStorage.setItem('tagClipboard', JSON.stringify(this.file.tags));
    }

    public paste(): void {
        const tags = JSON.parse(localStorage.getItem('tagClipboard'));
        this.addTags(tags);
    }

    public goToTimecode(timecode: Timecode): void {
        this.setCurrentTime(timecode.start);
        this.play();
    }

    public addTagSelectionToTimecode(tag: Tag): void {
        const alreadyAddedOnFile = this.file.tags.find(t => t.id === tag.id);
        if (!alreadyAddedOnFile) {
            this.addTag(tag);
        }

        this.selectedTagsForTimecode.push(tag);
    }

    public removeTagSelectionFromTimecode(tag: Tag): void {
        this.selectedTagsForTimecode = this.selectedTagsForTimecode.filter(
            t => t.id !== tag.id
        );
    }

    public setTagStart(): void {
        this.tagStart = formatPreciseDuration(this.player.currentTime);
    }

    public setTagEnd(): void {
        this.tagEnd = formatPreciseDuration(this.player.currentTime);
    }

    public goToTagStart(): void {
        if (!this.tagStart) {
            return;
        }

        this.setCurrentTime(
            this.convertFromSeparatedTimecodeToSeconds(this.tagStart)
        );
        if (!this.playing) {
            this.play();
        }
    }

    public goToTagEnd(): void {
        if (!this.tagEnd) {
            return;
        }

        this.setCurrentTime(
            this.convertFromSeparatedTimecodeToSeconds(this.tagEnd)
        );
        if (!this.playing) {
            this.play();
        }
    }

    public async saveTagTimecode(): Promise<void> {
        const tagStart = this.convertFromSeparatedTimecodeToSeconds(
            this.tagStart
        );
        const tagEnd = this.convertFromSeparatedTimecodeToSeconds(this.tagEnd);

        const selectedTimecodeTags = this.selectedTagsForTimecode.map(
            t => new TimecodeTag(null, null, t)
        );

        const tagTimecode = new Timecode(
            null,
            this.file.hash,
            this.file.path,
            selectedTimecodeTags,
            tagStart,
            tagEnd
        );
        const result = await this._service
            .createTagTimecode(this.file, tagTimecode)
            .toPromise();
        this.addTagTimecode(result);

        this.selectedTagsForTimecode = [];
        this.tagStart = null;
        this.tagEnd = null;
    }

    public removeTimecode(timecode: Timecode): void {
        this.timecodes = this.timecodes.filter(
            t => t.timecodeId !== timecode.timecodeId
        );
    }

    private convertFromSeparatedTimecodeToSeconds(
        separatedTimecode: string
    ): number {
        const components = separatedTimecode.split(':');
        return +components[0] * 3600 + +components[1] * 60 + +components[2];
    }

    private addTagTimecode(timecode: Timecode): void {
        const timecodes = this.timecodes.slice();
        timecodes.push(timecode);
        timecodes.sort((a, b) => {
            if (a.start < b.start) {
                return -1;
            } else if (a.start > b.start) {
                return 1;
            } else {
                return 0;
            }
        });
        this.timecodes = timecodes;
    }

    private setCurrentTime(newCurrentTime: number) {
        this.player.currentTime = newCurrentTime;
        this.playbackHasBeenStarted = true;
    }
}
