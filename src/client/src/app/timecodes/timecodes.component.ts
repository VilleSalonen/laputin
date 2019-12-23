import { Component, OnInit, Injectable } from '@angular/core';

import { File, Timecode, FileQuery } from './../models';
import { LaputinService } from './../laputin.service';
import { formatPreciseDuration } from '../file/precise-duration.pipe';

class TimecodeItem {
    constructor(
        public type: TimecodeItemType,
        public item: any,
        public codes: Timecode[]
    ) {}
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

    constructor(private _service: LaputinService) {}

    ngOnInit(): void {
        this.loadTimecodes();
    }

    loadTimecodes(): void {
        this.timecodeItems = [];
        this.loading = true;
        this._service
            .queryTimecodes(this._query)
            .toPromise()
            .then((timecodes: Timecode[]) => {
                this.exportCommands = [];
                timecodes.forEach(t => {
                    const name = t.path.substring(t.path.lastIndexOf('/') + 1);

                    const tags = t.timecodeTags
                        .map(ta => ta.tag.name)
                        .join(', ');

                    this.exportCommands.push(
                        'ffmpeg ' +
                            '-ss ' +
                            formatPreciseDuration(t.start) +
                            ' ' +
                            '-i "' +
                            t.path.replace(/\//g, '\\') +
                            '" ' +
                            '-t ' +
                            formatPreciseDuration(t.end - t.start) +
                            ' ' +
                            '-map v? -map a? -map s? -c:v hevc_nvenc -c:a copy -profile:v main -preset slow ' +
                            '"TARGET_DIR\\' +
                            name +
                            ' (' +
                            formatPreciseDuration(t.start).replace(
                                /[\:]/g,
                                '.'
                            ) +
                            '-' +
                            formatPreciseDuration(t.start).replace(
                                /[\:]/g,
                                '.'
                            ) +
                            ') [' +
                            tags +
                            '].mp4"'
                    );
                });

                const timecodesByFiles = {};
                timecodes.forEach(timecode => {
                    if (!timecodesByFiles[timecode.path]) {
                        timecodesByFiles[timecode.path] = [];
                    }

                    timecodesByFiles[timecode.path].push(timecode);
                });

                const timecodeItems: TimecodeItem[] = [];
                for (const key of Object.keys(timecodesByFiles)) {
                    const codes = timecodesByFiles[key];
                    timecodeItems.push(
                        new TimecodeItem(
                            TimecodeItemType.File,
                            new File(codes[0].hash, codes[0].path, [], 0),
                            codes
                        )
                    );
                }

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
