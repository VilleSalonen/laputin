import {
    Component,
    Input,
    Output,
    EventEmitter,
    Injectable,
    ViewChild,
    ElementRef,
    AfterViewInit,
    OnDestroy,
} from '@angular/core';

import {
    File,
    FileQuery,
    FileChange,
    ChangeDirection,
    Timecode,
    AutocompleteType,
} from './../models';
import { LaputinService } from './../laputin.service';
import { PlayerService, Progress } from '../player.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSliderChange } from '@angular/material/slider';
import { TagScreenshotDialogComponent } from '../tag-screenshot-dialog/tag-screenshot-dialog.component';
import { fromEvent, merge, of, Observable } from 'rxjs';
import {
    takeUntil,
    throttleTime,
    map,
    delay,
    switchMap,
    distinctUntilChanged,
    tap,
    filter,
} from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { tag } from 'rxjs-spy/operators';

@Component({
    selector: 'app-video-player',
    styleUrls: ['./video-player.component.scss'],
    templateUrl: './video-player.component.html',
})
@Injectable()
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
    public playbackHasBeenStarted = false;
    public showScreenshotPreview: boolean;
    public playing: boolean;
    public random: boolean;
    public duration: string;
    public isFullScreen: boolean;
    public cacheBuster = '';

    public tagCreationOpen = false;
    public AutocompleteType = AutocompleteType;

    public mouseOverVideo: boolean;

    private player: HTMLVideoElement;

    @ViewChild('playerView') playerView: ElementRef;
    @ViewChild('videoArea') videoArea: ElementRef;
    @ViewChild('player') playerElem: ElementRef;
    @ViewChild('slider') sliderElem: ElementRef;
    @ViewChild('volume') volumeSliderElem: ElementRef;

    private _file: File;
    public progress$: Observable<Progress>;

    @Input()
    get file(): File {
        return this._file;
    }
    set file(value: File) {
        if (this._file) {
            this.player.pause();
            this.player.removeAttribute('src');
            this.player.load();
        }

        this._file = value;
        this._playerService.setFile(value);

        this._service.proxyExists(this.file).subscribe((proxyExists) => {
            const sourceFile = !proxyExists
                ? `/media/${this.file.escapedUrl}`
                : `/proxies/${this.file.hash}.mp4`;
            this.player.setAttribute('src', sourceFile);
        });
    }

    public sliderMin = 0;
    public sliderMax = 1000000;
    public sliderValue: number;

    public volumeMin = 0;
    public volumeMax = 100;
    public volumeValue = 100;

    public showPreciseProgress = false;

    @Output()
    public fileChange: EventEmitter<FileChange> = new EventEmitter<
        FileChange
    >();

    public isMobile: boolean;

    private fileClosed: EventEmitter<void> = new EventEmitter<void>();

    constructor(
        private _service: LaputinService,
        private _playerService: PlayerService,
        private dialog: MatDialog,
        breakpointObserver: BreakpointObserver
    ) {
        breakpointObserver
            .observe([Breakpoints.Handset])
            .subscribe((result) => {
                this.isMobile = result.matches;
            });

        this.progress$ = this._playerService.progress$;
    }

    public ngAfterViewInit(): void {
        this.player = this.playerElem.nativeElement;
        this._playerService.setPlayer(this.player);

        const playStart = fromEvent(this.player, 'playing').pipe(
            tag('VideoPlayerComponent.playStart'),
            takeUntil(this.fileClosed)
        );
        const paused = fromEvent(this.player, 'pause').pipe(
            tag('VideoPlayerComponent.pause'),
            takeUntil(this.fileClosed)
        );
        const ended = fromEvent(this.player, 'ended').pipe(
            tag('VideoPlayerComponent.ended'),
            takeUntil(this.fileClosed)
        );
        const playEnd = merge(paused, ended).pipe(
            tag('VideoPlayerComponent.playEnd')
        );

        const playerDoubleClicked = fromEvent(this.player, 'dblclick').pipe(
            takeUntil(this.fileClosed)
        );
        playerDoubleClicked.subscribe(() => this.toggleFullScreen());

        playStart.subscribe(() => {
            this.playbackHasBeenStarted = true;
            this.playing = true;
        });
        playEnd.subscribe(() => (this.playing = false));

        const timeUpdates = fromEvent(this.player, 'timeupdate').pipe(
            takeUntil(this.fileClosed),
            tap(() => (this.playbackHasBeenStarted = true)),
            throttleTime(500),
            map(() => this.player.currentTime / this.player.duration),
            filter((time) => !isNaN(time)),
            tag('VideoPlayerComponent.timeUpdates')
        );

        timeUpdates.subscribe((playPercent: number) =>
            this.updateProgress(playPercent)
        );

        // Force progress update when video is changed or seeked.
        // Without forced update, these changes will be seen with a
        // delay.
        fromEvent(this.player, 'durationchange')
            .pipe(
                tag('VideoPlayerComponent.durationchange'),
                takeUntil(this.fileClosed)
            )
            .subscribe(() => {
                this.playbackHasBeenStarted = false;
                this.playing = false;
                this.duration = this.formatDuration(this.player.duration);
                this.updateProgress(0);
            });

        fromEvent(window, 'webkitfullscreenchange')
            .pipe(
                tag('VideoPlayerComponent.webkitfullscreenchange'),
                takeUntil(this.fileClosed)
            )
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

        const mouseEnter = fromEvent(
            this.videoArea.nativeElement,
            'mouseenter'
        );
        const mouseMove = fromEvent(this.videoArea.nativeElement, 'mousemove');
        const afterMouseMove = mouseMove.pipe(
            map((ev) => of(ev).pipe(delay(2000))),
            switchMap((flatten) => flatten),
            tag('VideoPlayerComponent.afterMouseMove')
        );
        const mouseLeave = fromEvent(
            this.videoArea.nativeElement,
            'mouseleave'
        );

        const starts = merge(mouseEnter, mouseMove).pipe(map(() => 'start'));
        const ends = merge(afterMouseMove, mouseLeave).pipe(map(() => 'end'));
        merge(starts, ends)
            .pipe(
                map((val) => val === 'start'),
                distinctUntilChanged(),
                tag('VideoPlayerComponent.mouseOverVideo'),
                takeUntil(this.fileClosed)
            )
            .subscribe((mouseOverVideo) => {
                this.mouseOverVideo = mouseOverVideo;
            });

        this.bindKeyboardShortcuts();
    }

    ngOnDestroy(): void {
        this.close();
    }

    private bindKeyboardShortcuts(): void {
        fromEvent(window, 'keyup')
            .pipe(takeUntil(this.fileClosed), tag('VideoPlayerComponent.keyup'))
            .subscribe((event: KeyboardEvent) => {
                if ((<any>event.srcElement).nodeName === 'INPUT') {
                    if (event.key === 'Escape') {
                        (<any>event.srcElement).blur();
                    }

                    return;
                }

                if ((<any>event.srcElement).nodeName !== 'BODY') {
                    return;
                }

                event.preventDefault();

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
                    case 's':
                        this.toggleRandom();
                        break;
                    case 'PrintScreen':
                        this.screenshot();
                        break;
                }
            });
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

        if (this.sliderElem && this.sliderElem.nativeElement) {
            this.sliderElem.nativeElement.blur();
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
        this._playerService.clearPlayer();
        this.fileClosed.emit();
    }

    public play(): void {
        this.player.play();
    }

    public pause(): void {
        this.player.pause();
    }

    public tinyStepBackward(): void {
        this._playerService.frameBackward(1);
    }

    public tinyStepForward(): void {
        this._playerService.frameForward(1);
    }

    public smallStepBackward(): void {
        this.setCurrentTime(
            Math.max(0, this._playerService.getCurrentTime() - 1 / 4.0)
        );
    }

    public smallStepForward(): void {
        this.setCurrentTime(this._playerService.getCurrentTime() + 1 / 4.0);
    }

    public largeStepBackward(): void {
        this.setCurrentTime(
            Math.max(0, this._playerService.getCurrentTime() - 10)
        );
    }

    public largeStepForward(): void {
        this.setCurrentTime(this._playerService.getCurrentTime() + 10);
    }

    public hugeStepBackward(): void {
        this.setCurrentTime(
            Math.max(0, this._playerService.getCurrentTime() - 60)
        );
    }

    public hugeStepForward(): void {
        this.setCurrentTime(this._playerService.getCurrentTime() + 60);
    }

    public megaStepBackward(): void {
        this.setCurrentTime(
            Math.max(0, this._playerService.getCurrentTime() - 600)
        );
    }

    public megaStepForward(): void {
        this.setCurrentTime(this._playerService.getCurrentTime() + 600);
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

    public openFile(): void {
        const query = new FileQuery();
        query.hash = this.file.hash;

        this._service.openFiles(query);
    }

    public screenshot(): void {
        this._service
            .screenshotFile(this.file, this._playerService.getCurrentTime())
            .toPromise()
            .then(() => {
                // Allow for a some delay because user only see this thumbnail when she changes to another file and then back.
                this.cacheBuster = '?cachebuster=' + new Date().toISOString();
                this.showScreenshotPreview = true;

                setTimeout(() => (this.showScreenshotPreview = false), 3000);
            });
    }

    public async screenshotTimecode(timecode: Timecode): Promise<void> {
        await this._service
            .screenshotTimecode(
                this.file,
                timecode,
                this._playerService.getCurrentTime()
            )
            .toPromise();
    }

    public openTagScreenshotDialog(): void {
        const dialogRef = this.dialog.open(TagScreenshotDialogComponent, {
            width: '500px',
            data: {
                file: this.file,
            },
        });

        dialogRef.afterClosed().subscribe((newTag) => {
            if (newTag) {
                this._service.addTag(this.file, newTag).toPromise();
                this._service
                    .screenshotTag(
                        newTag,
                        this.file,
                        this._playerService.getCurrentTime()
                    )
                    .toPromise();
            }
        });
    }

    private setCurrentTime(newCurrentTime: number) {
        this._playerService.setCurrentTime(newCurrentTime);
        this.playbackHasBeenStarted = true;
    }
}
