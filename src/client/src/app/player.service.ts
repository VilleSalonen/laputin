import {Injectable} from '@angular/core';

import {File} from './models/file';
import { Subject } from 'rxjs-compat/Subject';

@Injectable()
export class PlayerService {
    public player: HTMLVideoElement = null;

    public setPlayer(player: HTMLVideoElement): void {
        this.player = player;
    }

    public setCurrentTime(currentTime: number): void {
        this.player.currentTime = currentTime;
    }

    public play(): void {
        this.player.play();
    }
}
