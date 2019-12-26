import { Injectable } from '@angular/core';

@Injectable()
export class PlayerService {
    public player: HTMLVideoElement = null;

    public setPlayer(player: HTMLVideoElement): void {
        this.player = player;
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

        this.player = null;
    }
}
