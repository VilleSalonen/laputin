import {
    Component,
    Injectable,
    ElementRef,
    ViewChild,
    AfterViewInit
} from '@angular/core';

import { File } from './../models/file';
import { LaputinService } from './../laputin.service';
import { Subject, Observable } from 'rxjs';
import { FileQueryService } from '../file-query.service';
import { switchMap, take, map, shareReplay, tap } from 'rxjs/operators';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { Router } from '@angular/router';

@Component({
    styleUrls: ['./files.component.scss'],
    templateUrl: './files.component.html'
})
@Injectable()
export class FilesComponent implements AfterViewInit {
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
        this.files$ = this.fileQueryService.query$.pipe(
            switchMap(query => this._service.queryFiles(query)),
            tap(() => {
                if (this.filesScroller) {
                    this.filesScroller.scrollToIndex(
                        0,
                        undefined,
                        undefined,
                        0
                    );
                }
            }),
            shareReplay(1)
        );

        this.totalDuration$ = this.files$.pipe(
            map(files => {
                let totalSeconds = 0.0;
                files.forEach(f => {
                    const duration = parseFloat(f.metadata.duration);
                    if (!isNaN(duration)) {
                        totalSeconds += parseFloat(f.metadata.duration);
                    }
                });

                return this.humanDuration(totalSeconds);
            })
        );

        this.totalSize$ = this.files$.pipe(
            map(files => {
                let totalSize = 0.0;
                files.forEach(f => {
                    totalSize += f.size;
                });

                return this.humanFileSize(totalSize);
            })
        );
    }

    public ngAfterViewInit(): void {
        const totalWidth = this.filesElement.nativeElement.scrollWidth - 10;
        const aspectRatio = 16 / 9;

        let columns: number;
        if (totalWidth < 960) {
            columns = 1;
        } else if (totalWidth >= 960 && totalWidth < 1280) {
            columns = 2;
        } else if (totalWidth >= 1280 && totalWidth < 1920) {
            columns = 3;
        } else {
            columns = 4;
        }

        this.fileStyle = {
            width: Math.floor(totalWidth / columns) + 'px',
            height: Math.floor(totalWidth / columns / aspectRatio) + 'px'
        };

        this.files$.pipe(take(1)).subscribe((files: File[]) => {
            setTimeout(() => {
                let index = 0;

                const previousFileHash = sessionStorage.getItem(
                    'previousFileHash'
                );
                sessionStorage.removeItem('previousFileHash');

                if (previousFileHash) {
                    const foundIndex = files.findIndex(
                        f => f.hash === previousFileHash
                    );
                    if (foundIndex > -1) {
                        index = foundIndex;
                    }
                }

                this.filesScroller.scrollToIndex(
                    index,
                    undefined,
                    undefined,
                    0
                );
            });
        });
    }

    public openFiles(): void {
        this.fileQueryService.query$
            .pipe(take(1))
            .subscribe(query => this._service.openFiles(query).toPromise());
    }

    public openFile(file: File): void {
        sessionStorage.setItem('previousFileHash', file.hash);
        this.router.navigate(['/files', file.hash]);
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
}
