import {Injectable} from '@angular/core';

import {File} from './models/file';
import { Subject } from 'rxjs-compat/Subject';

@Injectable()
export class PlayerService {
    public filePlaying: Subject<File> = new Subject<File>();

    public setPlayingFile(file: File) {
        this.filePlaying.next(file);
    }
}
