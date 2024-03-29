import {
    Component,
    Injectable,
    ElementRef,
    ViewChild,
    AfterViewInit,
    ChangeDetectionStrategy,
} from '@angular/core';

import { File } from './../models/file';
import { LaputinService } from './../laputin.service';
import { Subject, Observable } from 'rxjs';
import { FileQueryService } from '../file-query.service';
import { switchMap, take, map, shareReplay, tap } from 'rxjs/operators';
import { VirtualScrollerComponent } from '@iharbeck/ngx-virtual-scroller';
import { Router } from '@angular/router';

enum ViewMode {
    Thumbnails,
    SmallThumbnails,
    Details,
}

@Component({
    styleUrls: ['./files.component.scss'],
    templateUrl: './files.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
@Injectable()
export class FilesComponent implements AfterViewInit {
    public ViewMode = ViewMode;

    public activeViewMode = ViewMode.Thumbnails;

    public allFilesSubscription: Subject<File[]> = new Subject<File[]>();
    public filesSubscription: Subject<File[]> = new Subject<File[]>();
    public hashParamSubscription: Subject<string> = new Subject<string>();

    public files$: Observable<File[]>;

    public totalDuration$: Observable<string>;
    public totalSize$: Observable<string>;

    public fileStyle: any;

    @ViewChild('files')
    public filesElement: ElementRef<HTMLDivElement>;

    @ViewChild('scroll')
    private filesScroller: VirtualScrollerComponent;

    constructor(
        private _service: LaputinService,
        private fileQueryService: FileQueryService,
        private router: Router
    ) {
        this.restorePreviousViewMode();

        this.files$ = this.fileQueryService.query$.pipe(
            switchMap((query) => this._service.queryFiles(query)),
            shareReplay(1),
            tap(() => this.scrollToIndex(0))
        );

        this.totalDuration$ = this.files$.pipe(
            map((files) => {
                let totalSeconds = 0.0;
                files.forEach((f) => {
                    const duration = parseFloat(f.metadata.duration);
                    if (!isNaN(duration)) {
                        totalSeconds += parseFloat(f.metadata.duration);
                    }
                });

                return this.humanDuration(totalSeconds);
            })
        );

        this.totalSize$ = this.files$.pipe(
            map((files) => {
                let totalSize = 0.0;
                files.forEach((f) => {
                    totalSize += f.size;
                });

                return this.humanFileSize(totalSize);
            })
        );
    }

    public ngAfterViewInit(): void {
        this.calculateStyle();

        this.files$
            .pipe(
                take(1),
                map((files) => {
                    let index = 0;

                    const previousFileId = sessionStorage.getItem(
                        'previousFileId'
                    );
                    sessionStorage.removeItem('previousFileId');

                    if (previousFileId) {
                        const foundIndex = files.findIndex(
                            (f) => '' + f.fileId === previousFileId
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

    public activateViewMode(newViewMode: ViewMode): void {
        this.activeViewMode = newViewMode;
        sessionStorage.setItem('previousViewMode', newViewMode.toString());
        this.calculateStyle();
        this.scrollToIndex(0);
    }

    private restorePreviousViewMode(): void {
        const previousViewModeStr = sessionStorage.getItem('previousViewMode');
        if (!previousViewModeStr) {
            return;
        }

        const previousViewModeInt = parseInt(previousViewModeStr, 10);
        if (isNaN(previousViewModeInt)) {
            return;
        }

        this.activeViewMode = previousViewModeInt;
    }

    private calculateStyle(): void {
        if (
            this.activeViewMode === ViewMode.Thumbnails ||
            this.activeViewMode === ViewMode.SmallThumbnails
        ) {
            const totalWidth = this.filesElement.nativeElement.scrollWidth - 10;
            const aspectRatio = 16 / 9;

            let columns = 1;

            if (totalWidth < 960) {
                columns = 1;
            } else if (totalWidth >= 960 && totalWidth < 1280) {
                columns = 2;
            } else if (totalWidth >= 1280 && totalWidth < 1920) {
                columns = 3;
            } else {
                columns = 4;
            }

            if (this.activeViewMode === ViewMode.SmallThumbnails) {
                columns *= 2;
            }

            this.fileStyle = {
                width: Math.floor(totalWidth / columns) + 'px',
                height: Math.floor(totalWidth / columns / aspectRatio) + 'px',
            };
        } else {
            this.fileStyle = {
                height: '200px',
                width: '100%',
            };
        }
    }

    public openFiles(): void {
        this.fileQueryService.query$
            .pipe(take(1))
            .subscribe((query) => this._service.openFiles(query).toPromise());
    }

    public rememberFile(file: File): void {
        sessionStorage.setItem('previousFileId', '' + file.fileId);
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

    private humanFileSize(bytes: number): string {
        const threshold = 1000;
        if (Math.abs(bytes) < threshold) {
            return bytes + ' B';
        }
        const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let unit = -1;
        do {
            bytes = bytes / threshold;
            ++unit;
        } while (Math.abs(bytes) >= threshold && unit < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[unit];
    }

    private scrollToIndex(index: number): void {
        if (this.filesScroller) {
            this.filesScroller.scrollToIndex(index, undefined, undefined, 0);
        }
    }
}
