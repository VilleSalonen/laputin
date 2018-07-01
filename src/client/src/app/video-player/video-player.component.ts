import {Component, Input, Output, EventEmitter, Injectable, Inject, ViewChild, ElementRef, HostListener, OnInit} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable } from 'rxjs/Rx';

import {File} from './../models/file';
import {FileQuery} from './../models/filequery';
import {FileChange, ChangeDirection} from './../models/filechange';
import {Tag, Timecode, TimecodeTag} from './../models/tag';
import {LaputinService} from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';

class MappedMouseEvent {
    constructor(public x: number, public y: number) {}
}

@Component({
    selector: 'app-video-player',
    styleUrls: ['./video-player.component.scss'],
    templateUrl: './video-player.component.html'
})
@Injectable()
export class VideoPlayerComponent {
    public playbackHasBeenStarted: boolean;
    public playing: boolean;
    public random: boolean;
    public progressText: string;
    public resolution: string;
    public isFullScreen: boolean;
    public cacheBuster: string;

    public tagCreationOpen = false;
    public AutocompleteType = AutocompleteType;

    private player: HTMLVideoElement;

    private cachedTimelineWidth: number;
    private cachedPlayheadWidth: number;
    private duration: string;

    private cachedTimelineBoundingClientRect: any;

    @ViewChild('playhead', { read: ElementRef }) playhead: ElementRef;
    @ViewChild('timeline', { read: ElementRef }) timeline: ElementRef;
    @ViewChild('playerView', { read: ElementRef }) playerView: ElementRef;

    @ViewChild('player') set content(content: ElementRef) {
        // Player element is never changed so if we already have a player, there
        // is no need to change it. For some reason this setter is invoked
        // constantly (for example when seeking). If we updated player on every
        // invoke, performance was degraded.
        if (this.player) {
            return;
        }

        if (!content) {
            return;
        }

        this.player = content.nativeElement;
        this.cacheBuster = null;

        const playStart = Observable
            .fromEvent(this.player, 'playing')
            .takeUntil(this.fileClosed);
        const paused = Observable
            .fromEvent(this.player, 'pause')
            .takeUntil(this.fileClosed);
        const ended = Observable
            .fromEvent(this.player, 'ended')
            .takeUntil(this.fileClosed);
        const playEnd = paused.merge(ended);

        const playerDoubleClicked = Observable
            .fromEvent(this.player, 'dblclick')
            .takeUntil(this.fileClosed);
        playerDoubleClicked.subscribe(() => this.toggleFullScreen());

        playStart.subscribe(() => this.playing = true);
        playEnd.subscribe(() => this.playing = false);

        const mouseDowns = Observable
            .fromEvent(this.playhead.nativeElement, 'mousedown')
            .takeUntil(this.fileClosed);
        const mouseMoves = Observable
            .fromEvent(window, 'mousemove')
            .takeUntil(this.fileClosed);
        const mouseUps = Observable
            .fromEvent(window, 'mouseup')
            .takeUntil(this.fileClosed);

        const timeUpdates = Observable
            .fromEvent(this.player, 'timeupdate')
            .takeUntil(this.fileClosed)
            .throttleTime(500)
            .map(() => this.player.currentTime / this.player.duration);

        const clicks = Observable.fromEvent(this.timeline.nativeElement, 'click')
            .takeUntil(this.fileClosed)
            .map((event: MouseEvent) => {
                event.preventDefault();

                const timelineBoundingRect = this.getTimelineBoundingRect();
                const timelineWidth = this.cachedTimelineWidth;

                return this.clickPercent(event.clientX, timelineBoundingRect, timelineWidth);
            });

        const drags = mouseDowns.concatMap(() => {
            const timelineBoundingRect = this.getTimelineBoundingRect();
            const timelineWidth = this.cachedTimelineWidth;

            return mouseMoves.takeUntil(mouseUps).map((dragEvent: MouseEvent) => {
                return this.clickPercent(dragEvent.clientX, timelineBoundingRect, timelineWidth);
            });
        });

        clicks
            .subscribe((playPercent: number) => {
                this.setPlayheadTo(playPercent);
                this.setProgress(playPercent);
            });

        drags
            .subscribe((playPercent: number) => this.setPlayheadTo(playPercent));
        drags
            .debounceTime(50)
            .subscribe((playPercent: number) => this.setProgress(playPercent));

        timeUpdates
            .subscribe((playPercent: number) =>
                this.updateProgress(playPercent)
            );

        playStart
            .merge(clicks)
            .merge(drags)
            .subscribe(() =>
                this.playbackHasBeenStarted = true
            );

        // Force progress update when video is changed or seeked.
        // Without forced update, these changes will be seen with a
        // delay.
        Observable.fromEvent(this.player, 'durationchange')
            .takeUntil(this.fileClosed)
            .subscribe(() => {
                this._service.getTagTimecodes(this.file).then((tagTimecodes) => this.tagTimecodes = tagTimecodes);

                this.playbackHasBeenStarted = false;
                this.playing = false;
                this.duration = this.formatDuration(this.player.duration);
                this.updateProgress(0);

                if (this.player.videoWidth && this.player.videoHeight) {
                    this.resolution = this.player.videoWidth + 'x' + this.player.videoHeight;
                }
            });

        Observable.fromEvent(window, 'webkitfullscreenchange')
            .takeUntil(this.fileClosed)
            .subscribe((event) => {
                this.isFullScreen = !this.isFullScreen;

                // We have to reset playhead because it might be further right than
                // the new timeline width allows.
                this.setPlayheadTo(0);
                this.resetCache();
                this.cachedTimelineWidth = this.timeline.nativeElement.offsetWidth - this.cachedPlayheadWidth;
                this.updateProgress(this.player.currentTime / this.player.duration);
            });

        const windowKeyups = Observable
            .fromEvent(window, 'keyup')
            .takeUntil(this.fileClosed);

        windowKeyups
            .subscribe((event: KeyboardEvent) => {
                if (event.srcElement.nodeName === 'INPUT') {
                    if (event.key === 'Escape') {
                        (<any>event.srcElement).blur();
                    }

                    return;
                }

                switch (event.key) {
                    case 'ArrowLeft':
                        if (event.shiftKey) {
                            this.tinyStepBackward();
                        } else {
                            this.smallStepBackward();
                        }
                        break;
                    case 'ArrowRight':
                        if (event.shiftKey) {
                            this.tinyStepForward();
                        } else {
                            this.smallStepForward();
                        }
                        break;
                    case 'ArrowUp':
                        this.largeStepForward();
                        break;
                    case 'ArrowDown':
                        this.largeStepBackward();
                        break;
                    case 'Enter':
                        if (event.altKey) {
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
                    case 'w':
                        this.goToPrevious();
                        break;
                    case 's':
                        this.goToNext();
                        break;
                    case 'c':
                        if (event.ctrlKey) {
                            this.copy();
                        }
                        break;
                    case 'v':
                        if (event.ctrlKey) {
                            this.paste();
                        }
                        break;
                }
        });

        this.cachedPlayheadWidth = this.playhead.nativeElement.offsetWidth;
        this.cachedTimelineWidth = this.timeline.nativeElement.offsetWidth - this.cachedPlayheadWidth;
    }

    @Input() file: File;

    public tagTimecodes: Timecode[];
    public tagTimecode: Tag;
    public tagStart: string;
    public tagEnd: string;

    @Output()
    public fileChange: EventEmitter<FileChange> = new EventEmitter<FileChange>();
    @Output()
    public fileClosed: EventEmitter<void> = new EventEmitter<void>();

    constructor(private _service: LaputinService) {
    }

    private setProgress(playPercent: number) {
        const newTime = this.player.duration * playPercent;
        if (!isNaN(newTime) && 0 <= newTime && newTime <= this.player.duration) {
            this.player.currentTime = newTime;
        }
    }

    private updateProgress(playPercent: number) {
        this.setPlayheadTo(playPercent);
        this.updateTime();
    }

    private updateTime(): void {
        const currentTime = this.formatDuration(this.player.currentTime);

        if (currentTime.indexOf('NaN') === -1 && this.duration.indexOf('NaN') === -1) {
            this.progressText = currentTime + '/' + this.duration;
        } else {
            this.progressText = '00:00/00:00';
        }
    }

    private formatDuration(durationInSeconds: number): string {
        const duration = moment.duration(durationInSeconds, 'seconds');

        let result = '';

        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        if (hours) {
            result += ((hours >= 10) ? hours : '0' + hours) + ':';
        }

        result += (minutes >= 10) ? minutes : '0' + minutes;
        result += ':';
        result += (seconds >= 10) ? seconds : '0' + seconds;

        return result;
    }

    private formatPreciseDuration(durationInSeconds: number): string {
        const duration = moment.duration(durationInSeconds, 'seconds');

        let result = '';

        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        const milliseconds = duration.milliseconds();

        result += ((hours >= 10) ? hours : '0' + hours);
        result += ':';
        result += (minutes >= 10) ? minutes : '0' + minutes;
        result += ':';
        result += (seconds >= 10) ? seconds : '0' + seconds;
        result += '.';
        result += (milliseconds >= 10) ? milliseconds : '0' + milliseconds;

        return result;
    }

    private getTimelineBoundingRect() {
        if (!this.cachedTimelineBoundingClientRect) {
            this.cachedTimelineBoundingClientRect = this.timeline.nativeElement.getBoundingClientRect();
        }

        return this.cachedTimelineBoundingClientRect.left + (this.cachedPlayheadWidth / 2);
    }

    private resetCache() {
        this.cachedTimelineBoundingClientRect = null;
    }

    private clickPercent(x, boundingRect, width) {
        const position = ((x - boundingRect) / width);
        return Math.max(0.0, Math.min(position, 1.0));
    }

    private setPlayheadTo(playPercent: number) {
        const leftMargin = this.cachedTimelineWidth * playPercent;
        this.playhead.nativeElement.style.marginLeft = leftMargin + 'px';
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

    public tinyStepBackward(): void {
        this.player.currentTime -= 1;
    }

    public smallStepBackward(): void {
        this.player.currentTime -= 10;
    }

    public largeStepBackward(): void {
        this.player.currentTime -= 60;
    }

    public tinyStepForward(): void {
        this.player.currentTime += 1;
    }

    public smallStepForward(): void {
        this.player.currentTime += 10;
    }

    public largeStepForward(): void {
        this.player.currentTime += 60;
    }

    public goToPrevious(): void {
        this.emitChange(ChangeDirection.Previous);
    }

    public goToNext(): void {
        this.emitChange(ChangeDirection.Next);
    }

    public toggleFullScreen(): void {
        if (this.isFullScreen) {
            document.webkitExitFullscreen();
        } else {
            this.playerView.nativeElement.webkitRequestFullScreen();
        }
    }

    private emitChange(direction: ChangeDirection): void {
        this.fileChange.emit(new FileChange(direction, this.random));
        this.playing = false;
    }

    public toggleTagCreation(): void {
        this.tagCreationOpen = !this.tagCreationOpen;
    }

    public addNewTag(newTag: string): void {
        this._service.createTag(newTag)
                     .subscribe(tag => {
                        this._service.addTag(this.file, tag)
                            .subscribe(() => this.addTagsToFile([tag]));
                     });
    }

    public addTag(tag: Tag): void {
        this.addTags([tag]);
    }

    public addTags(tags: Tag[]): void {
        this._service.addTags(this.file, tags)
                     .subscribe(() => this.addTagsToFile(tags));
    }

    public removeTag(tag: Tag): void {
        const tags = this.file.tags;
        this.file.tags = _.filter(this.file.tags, (t: Tag): boolean => t.id !== tag.id);
        this._service.deleteTagFileAssoc(this.file, tag)
            .subscribe(() => {});
    }

    private addTagsToFile(tags: Tag[]): void {
        const currentTags = this.file.tags;
        _.each(tags, (tag: Tag) => currentTags.push(tag));
        const sorted = _.sortBy(currentTags, (tag: Tag) => tag.name);
        this.file.tags = sorted;
    }

    public openFile(): void {
        const query = new FileQuery();
        query.hash = this.file.hash;

        this._service.openFiles(query);
    }

    public screenshot(): void {
        this._service.screenshotFile(this.file, this.player.currentTime);
        // Allow for a some delay because user only see this thumbnail when she changes to another file and then back.
        setTimeout(() => {
            this.cacheBuster = '?cachebuster=' + (new Date().toISOString());
        }, 1000);
    }

    public async screenshotTagTimecode(timecode: Timecode): Promise<void> {
        await this._service.screenshotTagTimecode(this.file, timecode, this.player.currentTime);
        timecode.cacheBuster = '?cachebuster=' + (new Date().toISOString());
    }

    public copy(): void {
        localStorage.setItem('tagClipboard', JSON.stringify(this.file.tags));
    }

    public paste(): void {
        const tags = JSON.parse(localStorage.getItem('tagClipboard'));
        this.addTags(tags);
    }

    public goToTimecode(timecode: Timecode): void {
        this.player.currentTime = timecode.start;
        this.play();
    }

    public setTimecodeTag(tag: Tag): void {
        this.tagTimecode = tag;
    }

    public setTagStart(): void {
        this.tagStart = this.formatPreciseDuration(this.player.currentTime);
    }

    public setTagEnd(): void {
        this.tagEnd = this.formatPreciseDuration(this.player.currentTime);
    }

    public goToTagStart(): void {
        if (!this.tagStart) {
            return;
        }

        this.player.currentTime = this.convertFromSeparatedTimecodeToSeconds(this.tagStart);
        if (!this.playing) {
            this.play();
        }
    }

    public goToTagEnd(): void {
        if (!this.tagEnd) {
            return;
        }

        this.player.currentTime = this.convertFromSeparatedTimecodeToSeconds(this.tagEnd);
        if (!this.playing) {
            this.play();
        }
    }

    public async saveTagTimecode(): Promise<void> {
        const tagStart = this.convertFromSeparatedTimecodeToSeconds(this.tagStart);
        const tagEnd = this.convertFromSeparatedTimecodeToSeconds(this.tagEnd);

        const tagTimecode = new Timecode(
            null,
            this.file.hash,
            [
                new TimecodeTag(
                    null,
                    null,
                    new Tag(this.tagTimecode.id, this.tagTimecode.name, 0))
            ],
            tagStart,
            tagEnd);
        const result = await this._service.createTagTimecode(this.file, tagTimecode);
        this.addTagTimecode(result);

        this.tagTimecode = null;
        this.tagStart = null;
        this.tagEnd = null;
    }

    private convertFromSeparatedTimecodeToSeconds(separatedTimecode: string): number {
        return moment.duration(separatedTimecode).asSeconds();
    }

    private addTagTimecode(timecode: Timecode): void {
        const tagTimecodes = this.tagTimecodes.slice();
        tagTimecodes.push(timecode);
        tagTimecodes.sort((a, b) => {
            if (a.start < b.start) {
                return -1;
            } else if (a.start > b.start) {
                return 1;
            } else {
                return 0;
            }
        });
        this.tagTimecodes = tagTimecodes;
    }
}
