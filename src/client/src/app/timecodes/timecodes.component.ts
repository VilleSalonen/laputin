import { Component, OnInit, Injectable, Inject } from '@angular/core';
import * as _ from 'lodash';

import { File } from './../models/file';
import { FileChange, ChangeDirection } from './../models/filechange';
import { Tag, Timecode } from './../models/tag';
import { FileQuery } from './../models/filequery';
import { LaputinService } from './../laputin.service';
import { PlayerService } from '../player.service';

@Component({
    styleUrls: ['./timecodes.component.scss'],
    templateUrl: './timecodes.component.html'
})
@Injectable()
export class TimecodesComponent implements OnInit {
    public TimecodeItemType = TimecodeItemType;

    public timecodeItems: TimecodeItem[] = [];
    public viewPortItems: TimecodeItem[] = [];
    public loading = false;
    private _query: FileQuery = new FileQuery();

    constructor(
        private _service: LaputinService,
        private _playerService: PlayerService
    ) {}

    ngOnInit(): void {
        this.loadTimecodes();
    }

    loadTimecodes(): void {
        this.timecodeItems = [];
        this.loading = true;
        this._service.queryTimecodes(this._query).then((timecodes: Timecode[]) => {
            const timecodesByFiles = _.groupBy(timecodes, (t: Timecode) => t.path);

            const timecodeItems: TimecodeItem[] = [];
            _.forOwn(timecodesByFiles, codes => {

                timecodeItems.push(new TimecodeItem(TimecodeItemType.File, new File(codes[0].hash, codes[0].path, [])));
                codes.forEach(c => timecodeItems.push(new TimecodeItem(TimecodeItemType.Timecode, c)));
            });

            this.timecodeItems = timecodeItems;
            this.loading = false;
        });
    }

    filterFiles(query: FileQuery): void {
        this._query = query;
        this.loadTimecodes();
    }
}

class FileWithTimecodes {
    constructor(public file: File, public timecodes: Timecode[]) {
    }
}

class TimecodeItem {
    constructor(public type: TimecodeItemType, public item: any) {
    }
}

enum TimecodeItemType {
    File,
    Timecode
}
