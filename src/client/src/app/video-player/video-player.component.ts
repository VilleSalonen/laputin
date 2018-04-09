import {Component, Input, Output, EventEmitter, Injectable, Inject, ViewChild, ElementRef, HostListener, OnInit} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable } from 'rxjs/Rx';

import {File} from './../models/file';
import {FileQuery} from './../models/filequery';
import {FileChange, ChangeDirection} from './../models/filechange';
import {Tag} from './../models/tag';
import {LaputinService} from './../laputin.service';

class MappedMouseEvent {
    constructor(public x: number, public y: number) {}
}

@Component({
    selector: 'app-video-player',
    styleUrls: ['./video-player.component.scss'],
    templateUrl: './video-player.component.html',
    providers: []
})
@Injectable()
export class VideoPlayerComponent {
    public playbackHasBeenStarted: boolean;
    public playing: boolean;
    public random: boolean;
    public progressText: string;
    public resolution: string;
    public isFullScreen: boolean;

    public tagCreationOpen = false;

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

        const playStart = Observable.fromEvent(this.player, 'playing');
        const paused = Observable.fromEvent(this.player, 'pause');
        const ended = Observable.fromEvent(this.player, 'ended');
        const playEnd = paused.merge(ended);

        const playerDoubleClicked = Observable.fromEvent(this.player, 'dblclick');
        playerDoubleClicked.subscribe(() => this.toggleFullScreen());

        playStart.subscribe(() => this.playing = true);
        playEnd.subscribe(() => this.playing = false);

        const mouseDowns = Observable.fromEvent(this.playhead.nativeElement, 'mousedown');
        const mouseMoves = Observable.fromEvent(window, 'mousemove');
        const mouseUps = Observable.fromEvent(window, 'mouseup');

        const timeUpdates = Observable.fromEvent(this.player, 'timeupdate')
            .throttleTime(500)
            .map(() => this.player.currentTime / this.player.duration);

        const clicks = Observable.fromEvent(this.timeline.nativeElement, 'click').map((event: MouseEvent) => {
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
            .throttleTime(50)
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
        Observable.fromEvent(this.player, 'durationchange').subscribe(() => {
            this.playbackHasBeenStarted = false;
            this.playing = false;
            this.duration = this.formatDuration(this.player.duration);
            this.updateProgress(0);

            if (this.player.videoWidth && this.player.videoHeight) {
                this.resolution = this.player.videoWidth + 'x' + this.player.videoHeight;
            }
        });

        Observable.fromEvent(window, 'webkitfullscreenchange').subscribe((event) => {
            this.isFullScreen = !this.isFullScreen;

            // We have to reset playhead because it might be further right than
            // the new timeline width allows.
            this.setPlayheadTo(0);
            this.resetCache();
            this.cachedTimelineWidth = this.timeline.nativeElement.offsetWidth - this.cachedPlayheadWidth;
            this.updateProgress(this.player.currentTime / this.player.duration);
        });

        const windowKeyups = Observable.fromEvent(window, 'keyup');

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
                            console.log('jes2');
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

    @Output()
    public fileChange: EventEmitter<FileChange> = new EventEmitter<FileChange>();

    constructor(@Inject(LaputinService) private _service: LaputinService) {
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

    public directory(): string {
        return this.file.path.replace(this.file.name, '').replace(/\//g, '\\');
    }

    public nameSansSuffix(): string {
        return this.file.name.substr(0, this.file.name.lastIndexOf('.'));
    }

    public suffix(): string {
        return this.file.name.substr(this.file.name.lastIndexOf('.'));
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
        this._service.createTag(this.file, newTag)
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
    }

    public copy(): void {
        localStorage.setItem('tagClipboard', JSON.stringify(this.file.tags));
    }

    public paste(): void {
        const tags = JSON.parse(localStorage.getItem('tagClipboard'));
        this.addTags(tags);
    }
}
