import {
    Component,
    Injectable,
    AfterViewInit,
    ElementRef,
    ViewChild
} from '@angular/core';

import { Timecode } from './../models';
import { LaputinService } from './../laputin.service';
import { Router } from '@angular/router';
import { TimecodeQueryService } from '../timecode-query.service';
import { switchMap, shareReplay, take, map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';

@Component({
    styleUrls: ['./timecodes.component.scss'],
    templateUrl: './timecodes.component.html'
})
@Injectable()
export class TimecodesComponent implements AfterViewInit {
    public timecodes$: Observable<Timecode[]>;
    public timecodesSummary$: Observable<any>;

    public fileStyle: any;

    @ViewChild('files')
    public filesElement: ElementRef<HTMLDivElement>;

    @ViewChild('scroll')
    private timecodesScroller: VirtualScrollerComponent;

    constructor(
        private _service: LaputinService,
        private router: Router,
        private timecodeQueryService: TimecodeQueryService
    ) {
        this.timecodes$ = this.timecodeQueryService.query$.pipe(
            switchMap(query => this._service.queryTimecodes(query)),
            shareReplay(1),
            tap(() => this.scrollToIndex(0))
        );

        this.timecodesSummary$ = this.timecodes$.pipe(
            map(timecodes => {
                const files = {};
                let fileCount = 0;
                timecodes.forEach(timecode => {
                    if (!files[timecode.hash]) {
                        files[timecode.hash] = true;
                        fileCount++;
                    }
                });

                let totalSeconds = 0.0;
                timecodes.forEach(t => {
                    const duration = t.end - t.start;
                    if (!isNaN(duration)) {
                        totalSeconds += duration;
                    }
                });

                return {
                    timecodeCount: timecodes.length,
                    fileCount: fileCount,
                    duration: this.humanDuration(totalSeconds)
                };
            })
        );
    }

    public ngAfterViewInit(): void {
        const totalWidth = this.filesElement.nativeElement.scrollWidth - 10;
        const aspectRatio = 16 / 9;

        let columns: number;
        if (totalWidth < 960) {
            columns = 2;
        } else if (totalWidth >= 960 && totalWidth < 1280) {
            columns = 4;
        } else if (totalWidth >= 1280 && totalWidth < 1920) {
            columns = 6;
        } else {
            columns = 8;
        }

        this.fileStyle = {
            width: Math.floor(totalWidth / columns) + 'px',
            height: Math.floor(totalWidth / columns / aspectRatio) + 'px'
        };

        this.timecodes$
            .pipe(
                take(1),
                map(timecodes => {
                    let index = 0;

                    const previousTimecodeId = parseInt(
                        sessionStorage.getItem('previousTimecodeId'),
                        10
                    );
                    sessionStorage.removeItem('previousTimecodeId');

                    if (previousTimecodeId) {
                        const foundIndex = timecodes.findIndex(
                            t => t.timecodeId === previousTimecodeId
                        );
                        if (foundIndex > -1) {
                            index = foundIndex;
                        }
                    }

                    return index;
                })
            )
            .subscribe((index: number) =>
                setTimeout(() => {
                    this.scrollToIndex(index);
                })
            );
    }

    public openTimecode(timecode: Timecode): void {
        sessionStorage.setItem('previousTimecodeId', '' + timecode.timecodeId);
        this.router.navigate([
            '/files',
            timecode.hash,
            { start: timecode.start }
        ]);
    }

    private humanDuration(seconds: number): string {
        const days = Math.floor(seconds / (3600 * 24));
        seconds -= days * 3600 * 24;
        const hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;
        const mins = Math.floor(seconds / 60);
        seconds -= mins * 60;

        if (days > 0) {
            return days + ' d ' + hours + ' h';
        } else if (hours > 0) {
            return hours + ' h ' + mins + ' min';
        } else {
            return mins + ' min ' + Math.floor(seconds) + ' s';
        }
    }

    private scrollToIndex(index: number): void {
        if (this.timecodesScroller) {
            this.timecodesScroller.scrollToIndex(
                index,
                undefined,
                undefined,
                0
            );
        }
    }
}
