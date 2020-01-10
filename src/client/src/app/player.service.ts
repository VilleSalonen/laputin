import { Injectable, EventEmitter } from '@angular/core';
import { fromEvent, BehaviorSubject, Subscription } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

@Injectable()
export class PlayerService {
    public player: HTMLVideoElement = null;

    private playerClosed = new EventEmitter<any>();

    public currentTime = new BehaviorSubject<number>(0);
    public subscription: Subscription;

    public setPlayer(player: HTMLVideoElement): void {
        this.player = player;

        this.subscription = fromEvent(this.player, 'timeupdate')
            .pipe(
                takeUntil(this.playerClosed),
                map(() => this.player.currentTime)
            )
            .subscribe(value => this.currentTime.next(value));
    }

    public getCurrentTime(): number {
        if (!this.player) {
            throw new Error('Player element not set!');
        }

        return this.player.currentTime;
    }

    public setCurrentTime(currentTime: number): void {
        if (this.player) {
            this.player.currentTime = currentTime;
        }
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

        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }

        this.playerClosed.emit();
        this.player = null;
    }
}
