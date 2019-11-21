import { Component, OnInit, Injectable } from '@angular/core';
import * as _ from 'lodash';

import { File, Timecode, FileQuery } from './../models';
import { LaputinService } from './../laputin.service';
import { Utils } from '../utils';

class TimecodeItem {
    constructor(public type: TimecodeItemType, public item: any, public codes: Timecode[]) {
    }
}

enum TimecodeItemType {
    File,
    Timecode
}

@Component({
    styleUrls: ['./timecodes.component.scss'],
    templateUrl: './timecodes.component.html'
})
@Injectable()
export class TimecodesComponent implements OnInit {
    public TimecodeItemType = TimecodeItemType;

    public timecodeAmount = 0;
    public timecodeItems: TimecodeItem[] = [];
    public loading = false;
    public exporting = false;
    public exportCommands: string[] = [];
    public exportCommandsStr = '';
    private _query: FileQuery = new FileQuery();

    constructor(
        private _service: LaputinService
    ) {}

    ngOnInit(): void {
        this.loadTimecodes();
    }

    loadTimecodes(): void {
        this.timecodeItems = [];
        this.loading = true;
        this._service.queryTimecodes(this._query).then((timecodes: Timecode[]) => {
            this.exportCommands = [];
            timecodes.forEach(t => {
                const name = t.path.substring(t.path.lastIndexOf('/') + 1);

                const tags = t.timecodeTags.map(ta => ta.tag.name).join(', ');

                this.exportCommands.push('ffmpeg ' +
                    '-ss ' + Utils.formatPreciseDuration(t.start) + ' ' +
                    '-i "' + t.path.replace(/\//g, '\\') + '" ' +
                    '-t ' + Utils.formatPreciseDuration(t.end - t.start) + ' ' +
                    '-map v? -map a? -map s? -c:v hevc_nvenc -c:a copy -profile:v main -preset slow ' +
                    '"TARGET_DIR\\' + name +
                    ' (' + Utils.formatPreciseDuration(t.start).replace(/[\:]/g, '.') +
                    '-' + Utils.formatPreciseDuration(t.start).replace(/[\:]/g, '.') + ') ['
                    + tags + '].mp4"');
            });

            const timecodesByFiles = _.groupBy(timecodes, (t: Timecode) => t.path);

            const timecodeItems: TimecodeItem[] = [];
            _.forOwn(timecodesByFiles, codes => {
                timecodeItems.push(new TimecodeItem(TimecodeItemType.File, new File(codes[0].hash, codes[0].path, [], 0), codes));
            });

            this.timecodeAmount = timecodes.length;
            this.timecodeItems = timecodeItems;
            this.loading = false;
        });
    }

    filterFiles(query: FileQuery): void {
        this._query = query;
        this.loadTimecodes();
    }

    public export(): void {
        this.exporting = true;
        this.exportCommandsStr = this.exportCommands.join('\r\n');
    }
}
