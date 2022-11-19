import { Injectable, EventEmitter, NgZone } from '@angular/core';
import {
    fromEvent,
    BehaviorSubject,
    Subscription,
    merge,
    zip,
    Subject,
} from 'rxjs';

import { File } from '../app/models/file';
import { map } from 'rxjs/operators';

export class Progress {
    constructor(
        public frame: number,
        public timecode: number,
        public currentTime: number
    ) {}
}

@Injectable()
export class PlayerService {
    public file: File;
    public player: HTMLVideoElement = null;

    public progress$ = new BehaviorSubject<Progress>(new Progress(0, 0, 0));
    public initialized = new Subject<void>();

    private fps: number;
    private frameInSeconds: number;
    private frameWindowLower: number;
    private frameWindowUpper: number;
    private currentFrame: number;
    private paintCount = '';
    private lastPaintCount: number;
    private nextFrame = 1;
    private nextFrameTime: number;

    private playerClosed = new EventEmitter<any>();

    private durationSubscription: Subscription;
    private frameSubscription: Subscription;

    constructor(private ngZone: NgZone) {}

    public setFile(file: File) {
        this.file = file;
    }

    public setPlayer(player: HTMLVideoElement): void {
        this.player = player;

        if ((<any>this.player).mozPaintedFrames !== undefined) {
            this.paintCount = 'mozPaintedFrames';
        }
        if ((<any>this.player).webkitDecodedFrameCount !== undefined) {
            this.paintCount = 'webkitDecodedFrameCount';
        }

        this.durationSubscription = fromEvent(
            this.player,
            'durationchange'
        ).subscribe((event: any) => {
            // This event is also triggered when the end of the video is reached. We only want to initialize when a
            // video is started.
            if (event.target.currentTime !== 0) {
                return;
            }

            const components = this.file.metadata.framerate.split('/');
            this.fps =
                parseInt(components[0], 10) / parseInt(components[1], 10);
            this.frameInSeconds = 1 / this.fps;
            this.frameWindowLower = this.frameInSeconds * 0.95;
            this.frameWindowUpper = this.frameInSeconds * 0.25;

            this.currentFrame = 0;
            this.lastPaintCount = 0;
            this.nextFrame = 1;
            this.nextFrameTime = this.nextFrame * this.frameInSeconds;

            this.initialized.next();
            this.emit();
        });

        const seekedFrameUpdates = fromEvent(this.player, 'seeked').pipe(
            map(() => Math.floor(this.player.currentTime / this.frameInSeconds))
        );

        const pauseFrameUpdates = fromEvent(this.player, 'pause').pipe(
            map(() => Math.round(this.player.currentTime / this.frameInSeconds))
        );

        this.frameSubscription = merge(
            seekedFrameUpdates,
            pauseFrameUpdates
        ).subscribe((frame: number) => {
            this.currentFrame = frame;
            this.nextFrame = frame + 1;
            this.nextFrameTime = this.nextFrame * this.frameInSeconds;
            if (this.paintCount) {
                this.lastPaintCount = this.player[this.paintCount];
            }
            this.emit();
        });

        this.ngZone.runOutsideAngular(() => {
            requestAnimationFrame(() => this.loop());
        });
    }

    private loop(): void {
        if (!this.player) {
            return;
        }

        const time = this.player.currentTime;
        const frame = Math.round(time / this.frameInSeconds);
        if (this.paintCount) {
            const currentPaintCount = this.player[this.paintCount];
            const diffPaintCount = currentPaintCount - this.lastPaintCount;
            const check =
                time >= this.nextFrameTime - this.frameWindowLower &&
                time <= this.nextFrameTime + this.frameWindowUpper;
            if (check && diffPaintCount > 0) {
                this.currentFrame = this.nextFrame++;
                this.nextFrameTime = this.nextFrame * this.frameInSeconds;

                this.emit();
            } else if (
                time >= this.nextFrameTime &&
                this.currentFrame < this.nextFrame
            ) {
                this.currentFrame = frame;
                this.nextFrame = this.currentFrame + 1;
                this.nextFrameTime = this.nextFrame * this.frameInSeconds;
            }
            this.lastPaintCount = currentPaintCount;
        } else {
            this.currentFrame = frame;
        }

        this.ngZone.runOutsideAngular(() => {
            requestAnimationFrame(() => this.loop());
        });
    }

    private emit(): void {
        const timecode = this.currentFrame * this.frameInSeconds;
        this.progress$.next(
            new Progress(this.currentFrame, timecode, this.player.currentTime)
        );
    }

    public getCurrentTime(): number {
        if (!this.player) {
            throw new Error('Player element not set!');
        }

        return this.progress$.value.currentTime;
    }

    public setCurrentTime(currentTime: number): void {
        if (this.player) {
            this.player.currentTime = currentTime;
        }
    }

    public setCurrentFrame(currentFrame: number): void {
        if (this.player) {
            this.player.currentTime =
                currentFrame * this.frameInSeconds + 0.001;
        }
    }

    public frameForward(frameAmount: number): void {
        this.player.currentTime += this.frameInSeconds * frameAmount;
    }

    public frameBackward(frameAmount: number): void {
        this.player.currentTime -= this.frameInSeconds * frameAmount;
    }

    public play(): void {
        if (this.player) {
            this.player.play();
        }
    }

    public clearPlayer(): void {
        if (this.player) {
            this.player.remove();
        }

        this.playerClosed.emit();
        this.player = null;

        if (this.durationSubscription) {
            this.durationSubscription.unsubscribe();
            this.durationSubscription = null;
        }

        if (this.frameSubscription) {
            this.frameSubscription.unsubscribe();
            this.frameSubscription = null;
        }
    }
}
