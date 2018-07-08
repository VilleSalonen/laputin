import { Component, OnInit, Injectable, Inject } from '@angular/core';
import * as _ from 'lodash';

import { File } from './../models/file';
import { FileChange, ChangeDirection } from './../models/filechange';
import { Tag, Timecode } from './../models/tag';
import { FileQuery } from './../models/filequery';
import { LaputinService } from './../laputin.service';
import { PlayerService } from '../player.service';
import * as moment from 'moment';

@Component({
    styleUrls: ['./timecodes.component.scss'],
    templateUrl: './timecodes.component.html'
})
@Injectable()
export class TimecodesComponent implements OnInit {
    public TimecodeItemType = TimecodeItemType;

    public timecodeAmount = 0;
    public timecodeItems: TimecodeItem[] = [];
    public viewPortItems: TimecodeItem[] = [];
    public loading = false;
    public exporting = false;
    public exportCommands: string[] = [];
    public exportCommandsStr = '';
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
            this.exportCommands = [];
            timecodes.forEach(t => {
                const name = t.path.substring(t.path.lastIndexOf('/') + 1);

                const tags = t.timecodeTags.map(ta => ta.tag.name).join(', ');

                this.exportCommands.push('ffmpeg ' +
                    '-ss ' + this.formatPreciseDuration(t.start) + ' ' +
                    '-i "' + t.path.replace(/\//g, '\\') + '" ' +
                    '-t ' + this.formatPreciseDuration(t.end - t.start) + ' ' +
                    '-map v? -map a? -map s? -c:v hevc_nvenc -c:a copy -profile:v main -preset slow ' +
                    '"TARGET_DIR\\' + name +
                    ' (' + this.formatPreciseDuration(t.start).replace(/[\:]/g, '.') +
                    '-' + this.formatPreciseDuration(t.start).replace(/[\:]/g, '.') + ') ['
                    + tags + '].mp4"');
            });

            const timecodesByFiles = _.groupBy(timecodes, (t: Timecode) => t.path);

            const timecodeItems: TimecodeItem[] = [];
            _.forOwn(timecodesByFiles, codes => {

                timecodeItems.push(new TimecodeItem(TimecodeItemType.File, new File(codes[0].hash, codes[0].path, [], 0)));
                codes.forEach(c => timecodeItems.push(new TimecodeItem(TimecodeItemType.Timecode, c)));
            });

            this.timecodeAmount = timecodes.length;
            this.timecodeItems = timecodeItems;
            this.loading = false;
        });
    }

    private formatPreciseDuration(durationInSeconds: number): string {
        const duration = moment.duration(durationInSeconds, 'seconds');

        let result = '';

        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        const milliseconds = parseInt(duration.milliseconds().toFixed(0), 10);

        result += ((hours >= 10) ? hours : '0' + hours);
        result += ':';
        result += (minutes >= 10) ? minutes : '0' + minutes;
        result += ':';
        result += (seconds >= 10) ? seconds : '0' + seconds;
        result += '.';
        result += (milliseconds > 100) ? milliseconds : (milliseconds >= 10) ? '0' + milliseconds : '00' + milliseconds;

        return result;
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
