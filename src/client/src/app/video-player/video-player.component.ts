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
    template: `
        <div [ngClass]="{'full-screen': isFullScreen}">
            <div #playerView class="column player-view" *ngIf="file">
                <div class="filename">
                    <span class="filename-small">{{directory()}}</span><br />
                    <span style="filename-bigg">{{nameSansSuffix()}}</span><span class="filename-small">{{suffix()}}</span>
                </div>

                <div class="player">
                    <video src="/media/{{file.escapedUrl()}}" #player></video>
                    <div class="player-controls">
                        <div class="player-main-button">
                            <span class="fa fa-play" aria-hidden="true" (click)="play()" *ngIf="!playing"></span>
                            <span class="fa fa-pause" aria-hidden="true" (click)="pause()" *ngIf="playing"></span>
                        </div>

                        <div class="timeline-and-buttons">
                            <div class="timeline" #timeline>
                                <div class="playhead" #playhead></div>
                            </div>

                            <div>
                                <span class="fa fa-random" aria-hidden="true" (click)="random = !random"
                                    [ngClass]="{'active-button': random}"></span>
                                <span class="fa fa-fast-backward" aria-hidden="true" (click)="goToPrevious()"></span>
                                <span class="fa fa-fast-forward" aria-hidden="true" (click)="goToNext()"></span>

                                <span>{{progressText}}</span>
                            </div>
                        </div>

                        <div class="player-main-button">
                            <span class="fa fa-arrows-alt" aria-hidden="true" (click)="toggleFullScreen()"></span>
                        </div>
                    </div>
                </div>

                <div class="tagging">
                    <p>
                        <small>
                            <a (click)="openFile()" title="Open in external player">
                                <span class="fa fa-film" aria-hidden="true"></span>
                            </a>
                            <a (click)="copy()" title="Copy tags">Copy tags</a>
                            <a (click)="paste()" title="Paste tags">Paste tags</a>
                        </small>
                    </p>

                    <div class="row">
                        <div class="tag-tools">
                            <app-tag-autocomplete [tagContainer]="file" (select)="addTag($event)"></app-tag-autocomplete>

                            <small><a (click)="toggleTagCreation()">Didn't find the tag you were looking for..?</a></small>

                            <div *ngIf="tagCreationOpen">
                                <app-search-box (update)="addNewTag($event)" clearOnEnter="1"></app-search-box>
                            </div>
                        </div>

                        <div class="tags">
                            <div *ngFor="let tag of file.tags" class="tag" (click)="removeTag(tag)">
                                {{tag.name}}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`,
    providers: []
})
@Injectable()
export class VideoPlayerComponent {
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

        timeUpdates
            .merge(clicks)
            .merge(drags)
            .subscribe((playPercent: number) => this.setPlayPercentage(playPercent));

        // Force progress update when video is changed or seeked.
        // Without forced update, these changes will be seen with a
        // delay.
        Observable.fromEvent(this.player, 'durationchange').subscribe(() => {
            this.playing = false;
            this.duration = this.formatDuration(this.player.duration);
            this.setPlayPercentage(0);

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
            this.setPlayPercentage(this.player.currentTime / this.player.duration);
        });

        Observable.fromEvent(window, 'keyup').subscribe((event: KeyboardEvent) => {
            if (event.srcElement.nodeName === 'INPUT') {
                if (event.code === 'Escape') {
                    (<any>event.srcElement).blur();
                }

                return;
            }

            switch (event.code) {
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
                case 'Space':
                    if (this.playing) {
                        this.pause();
                    } else {
                        this.play();
                    }
                    break;
                case 'KeyW':
                    this.goToPrevious();
                    break;
                case 'KeyS':
                    this.goToNext();
                    break;
                case 'KeyC':
                    if (event.ctrlKey) {
                        this.copy();
                    }
                    break;
                case 'KeyV':
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

    private setPlayPercentage(playPercent: number) {
        this.setPlayheadTo(this.cachedTimelineWidth * playPercent);
        this.player.currentTime = this.player.duration * playPercent;
        this.progressUpdate();
    }

    private progressUpdate(): void {
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

    private setPlayheadTo(leftMargin) {
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

    public copy(): void {
        localStorage.setItem('tagClipboard', JSON.stringify(this.file.tags));
    }

    public paste(): void {
        const tags = JSON.parse(localStorage.getItem('tagClipboard'));
        this.addTags(tags);
    }
}
