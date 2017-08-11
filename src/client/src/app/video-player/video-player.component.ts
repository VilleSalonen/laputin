import {Component, Input, Output, EventEmitter, Injectable, Inject, ViewChild, ElementRef} from "@angular/core";
import * as _ from "lodash";
import * as moment from "moment";

import {File} from "./../models/file";
import {FileQuery} from "./../models/filequery";
import {FileChange, ChangeDirection} from "./../models/filechange";
import {Tag} from "./../models/tag";
import {LaputinService} from "./../laputin.service";

@Component({
    selector: "video-player",
    template: `
        <div class="row" *ngIf="file" style="width: 99%">
            <div class="col-md-4">
                <video style="width: 100%" src="/media/{{file.escapedUrl()}}" controls #player></video>
                <div>
                    <span class="glyphicon glyphicon-play" aria-hidden="true" (click)="play()" *ngIf="!playing"></span>
                    <span class="glyphicon glyphicon-pause" aria-hidden="true" (click)="pause()" *ngIf="playing"></span>
                    <span class="glyphicon glyphicon-random" aria-hidden="true" (click)="random = !random" [ngClass]="{'active-button': random}"></span>
                    <span class="glyphicon glyphicon-step-backward" aria-hidden="true" (click)="goToPrevious()"></span>
                    <span class="glyphicon glyphicon-step-forward" aria-hidden="true" (click)="goToNext()"></span>
                    <span class="glyphicon glyphicon-fullscreen" aria-hidden="true" (click)="fullScreen()"></span>
                    <a (click)="largeStepBackward()">&lt;&lt;</a>
                    <a (click)="smallStepBackward()">&lt;</a>
                    <a (click)="smallStepForward()">&gt;</a>
                    <a (click)="largeStepForward()">&gt;&gt;</a>

                    <progress value="{{progress}}" max="100"></progress> {{progressText}}
                </div>
            </div>
            <div class="col-md-8">
                <p>
                    <strong>{{file.path}}</strong>
                    <small>
                        <a (click)="openFile()" title="Open in external player"><span class="glyphicon glyphicon-film" aria-hidden="true"></span></a>
                        <a (click)="copy()" title="Copy tags"><span class="glyphicon glyphicon-copy" aria-hidden="true"></span></a>
                        <a (click)="paste()" title="Paste tags"><span class="glyphicon glyphicon-paste" aria-hidden="true"></span></a>
                    </small>
                </p>

                <div class="row">
                    <div class="col-md-2">
                        <p>
                            <tag-autocomplete [tagContainer]="file" (select)="addTag($event)"></tag-autocomplete>
                        </p>

                        <p>
                            <small><a (click)="toggleTagCreation()">Didn't find the tag you were looking for..?</a></small>
                        </p>

                        <div *ngIf="tagCreationOpen">
                            <search-box (update)="addNewTag($event)" clearOnEnter="1"></search-box>
                        </div>
                    </div>

                    <div class="col-md-10">
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

    public tagCreationOpen: boolean = false;

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

        this.player.addEventListener("playing", () => { this.playing = true; });
        this.player.addEventListener("pause", () => { this.playing = false; });
        this.player.addEventListener("ended", () => { this.playing = false; });

        // Force progress update when video is changed or seeked.
        // Without forced update, these changes will be seen with a
        // delay.
        this.player.addEventListener("durationchange", () => {
            this.playing = false;
            this._progressUpdate();
        });
        this.player.addEventListener("seeked", () => this._progressUpdate());
        // Normal playback progress updates can be optimized.
        this.player.addEventListener("timeupdate", () => this._optimizedProgressUpdate());
    }

    @Input() file: File;

    @Output()
    public fileChange: EventEmitter<FileChange> = new EventEmitter<FileChange>();

    constructor(@Inject(LaputinService) private _service: LaputinService) {
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
        var tags = this.file.tags;
        this.file.tags = _.filter(this.file.tags, (t: Tag): boolean => t.id !== tag.id);
        this._service.deleteTagFileAssoc(this.file, tag)
            .subscribe(() => {});
    }

    private addTagsToFile(tags: Tag[]): void {
        var currentTags = this.file.tags;
        _.each(tags, (tag: Tag) => currentTags.push(tag));
        var sorted = _.sortBy(currentTags, (tag: Tag) => tag.name);
        this.file.tags = sorted;
    }

    public openFile(): void {
        var query = new FileQuery();
        query.hash = this.file.hash;

        this._service.openFiles(query);
    }

    public copy(): void {
        localStorage.setItem("tagClipboard", JSON.stringify(this.file.tags));
    }

    public paste(): void {
        var tags = JSON.parse(localStorage.getItem("tagClipboard"));
        this.addTags(tags);
    }

    private _optimizedProgressUpdate(): void {
        let current = moment();
        if (this._previousUpdate && current.diff(this._previousUpdate) < 1000) {
            return;
        }

        this._previousUpdate = current;

        this._progressUpdate();
    }

    private _progressUpdate(): void {
        let currentTime = this.formatDuration(this.player.currentTime);
        let duration = this.formatDuration(this.player.duration);

        if (currentTime.indexOf("NaN") == -1 && duration.indexOf("NaN") == -1) {
            this.progressText = currentTime + "/" + duration;
            this.progress = (this.player.currentTime / this.player.duration) * 100;
        } else {
            this.progressText = "00:00/00:00";
            this.progress = 0;
        }
    }

    private formatDuration(durationInSeconds: number): string {
        let duration = moment.duration(durationInSeconds, "seconds")

        let result = "";

        let hours = duration.hours();
        let minutes = duration.minutes();
        let seconds = duration.seconds();

        if (hours) {
            result += ((hours >= 10) ? hours : "0" + hours) + ":";
        }

        result += (minutes >= 10) ? minutes : "0" + minutes;
        result += ":";
        result += (seconds >= 10) ? seconds : "0" + seconds;

        return result;
    }
}
