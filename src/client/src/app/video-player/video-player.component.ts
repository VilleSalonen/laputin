import {Component, Input, Output, EventEmitter, Injectable, Inject, ViewChild, ElementRef} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

import {File} from './../models/file';
import {FileQuery} from './../models/filequery';
import {FileChange, ChangeDirection} from './../models/filechange';
import {Tag} from './../models/tag';
import {LaputinService} from './../laputin.service';

@Component({
    selector: 'app-video-player',
    styleUrls: ['./video-player.component.scss'],
    template: `
        <div class="column" *ngIf="file" style="display: flex; flex-direction: column; max-height: 100%; min-height: 100%;">
            <div style="padding: 24px; padding-bottom: 0; font-weight: bold;">
                <span style="margin: 0; font-size: 14px;">{{directory()}}</span><br />
                <span style="margin-top: 0; margin-bottom: 0; font-size: 20px;">{{nameSansSuffix()}}</span><span style="font-size: 14px;">{{suffix()}}</span>
            </div>

            <div class="player">
                <video style="max-height: 100%; max-width: 100%;" src="/media/{{file.escapedUrl()}}" controls #player></video>
            </div>

            <div class="tagging">
                <div>
                    <span class="fa fa-play" aria-hidden="true" (click)="play()" *ngIf="!playing"></span>
                    <span class="fa fa-pause" aria-hidden="true" (click)="pause()" *ngIf="playing"></span>
                    <span class="fa fa-random" aria-hidden="true" (click)="random = !random"
                        [ngClass]="{'active-button': random}"></span>
                    <span class="fa fa-fast-backward" aria-hidden="true" (click)="goToPrevious()"></span>
                    <span class="fa fa-fast-forward" aria-hidden="true" (click)="goToNext()"></span>
                    <span class="fa fa-arrows-alt" aria-hidden="true" (click)="fullScreen()"></span>
                    <span class="fa fa-backward" aria-hidden="true" (click)="largeStepBackward()"></span>
                    <span class="fa fa-step-backward" aria-hidden="true" (click)="smallStepBackward()"></span>
                    <span class="fa fa-step-forward" aria-hidden="true" (click)="smallStepForward()"></span>
                    <span class="fa fa-forward" aria-hidden="true" (click)="largeStepForward()"></span>

                    <progress value="{{progress}}" max="100"></progress> {{progressText}} {{resolution}}
                </div>

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
                    <div>
                        <p>
                            <app-tag-autocomplete [tagContainer]="file" (select)="addTag($event)"></app-tag-autocomplete>
                        </p>

                        <p>
                            <small><a (click)="toggleTagCreation()">Didn't find the tag you were looking for..?</a></small>
                        </p>

                        <div *ngIf="tagCreationOpen">
                            <app-search-box (update)="addNewTag($event)" clearOnEnter="1"></app-search-box>
                        </div>
                    </div>

                    <div>
                        <p>
                            <span *ngFor="let tag of file.tags">
                                <button (click)="removeTag(tag)" class="btn btn-success tag">{{tag.name}}</button>
                            </span>
                        </p>
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
    public progress: number;
    public progressText: string;
    public resolution: string;

    public tagCreationOpen = false;

    private player: HTMLVideoElement;

    private _previousUpdate: moment.Moment;

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

        this.player.addEventListener('playing', () => { this.playing = true; });
        this.player.addEventListener('pause', () => { this.playing = false; });
        this.player.addEventListener('ended', () => { this.playing = false; });

        // Force progress update when video is changed or seeked.
        // Without forced update, these changes will be seen with a
        // delay.
        this.player.addEventListener('durationchange', () => {
            this.playing = false;
            this._progressUpdate();

            if (this.player.videoWidth && this.player.videoHeight) {
                this.resolution = this.player.videoWidth + 'x' + this.player.videoHeight;
            }
        });
        this.player.addEventListener('seeked', () => this._progressUpdate());
        // Normal playback progress updates can be optimized.
        this.player.addEventListener('timeupdate', () => this._optimizedProgressUpdate());
    }

    @Input() file: File;

    @Output()
    public fileChange: EventEmitter<FileChange> = new EventEmitter<FileChange>();

    constructor(@Inject(LaputinService) private _service: LaputinService) {
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

    public smallStepBackward(): void {
        this.player.currentTime -= 10;
    }

    public largeStepBackward(): void {
        this.player.currentTime -= 60;
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

    public fullScreen(): void {
        this.player.webkitRequestFullScreen();
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

    private _optimizedProgressUpdate(): void {
        const current = moment();
        if (this._previousUpdate && current.diff(this._previousUpdate) < 1000) {
            return;
        }

        this._previousUpdate = current;

        this._progressUpdate();
    }

    private _progressUpdate(): void {
        const currentTime = this.formatDuration(this.player.currentTime);
        const duration = this.formatDuration(this.player.duration);

        if (currentTime.indexOf('NaN') === -1 && duration.indexOf('NaN') === -1) {
            this.progressText = currentTime + '/' + duration;
            this.progress = (this.player.currentTime / this.player.duration) * 100;
        } else {
            this.progressText = '00:00/00:00';
            this.progress = 0;
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
}
