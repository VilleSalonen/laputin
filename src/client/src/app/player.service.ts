import { Injectable } from '@angular/core';

@Injectable()
export class PlayerService {
    public player: HTMLVideoElement = null;

    public setPlayer(player: HTMLVideoElement): void {
        this.player = player;
    }

    public getCurrentTime(): number {
        return this.player.currentTime;
    }

    public setCurrentTime(currentTime: number): void {
        this.player.currentTime = currentTime;
    }

    public play(): void {
        this.player.play();
    }
}
