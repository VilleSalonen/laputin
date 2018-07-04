import {Injectable} from '@angular/core';

import {File} from './models/file';
import { Subject } from 'rxjs-compat/Subject';

@Injectable()
export class PlayerService {
    public filePlaying: Subject<File> = new Subject<File>();
    public player: HTMLVideoElement = null;

    public setPlayingFile(file: File): void {
        this.filePlaying.next(file);

        if (!file) {
            this.player = null;
        }
    }

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
