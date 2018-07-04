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
    public filesWithTimecodes: FileWithTimecodes[] = [];
    public viewPortItems: File[] = [];
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
        this.filesWithTimecodes = [];
        this.loading = true;
        this._service.queryTimecodes(this._query).then((timecodes: Timecode[]) => {
            const timecodesByFiles = _.groupBy(timecodes, (t: Timecode) => t.path);

            const bar: FileWithTimecodes[] = [];
            _.forOwn(timecodesByFiles, foo => {
                bar.push(new FileWithTimecodes(foo[0].path, foo));
            });

            this.filesWithTimecodes = bar;
            this.loading = false;
        });
    }

    filterFiles(query: FileQuery): void {
        this._query = query;
        this.loadTimecodes();
    }
}

class FileWithTimecodes {
    constructor(public path: string, public timecodes: Timecode[]) {
    }
}
