import {
    Component,
    HostBinding,
    AfterViewInit,
    ViewChild,
    ElementRef
} from '@angular/core';
import { LaputinService } from '../laputin.service';
import { FileQueryService } from '../file-query.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
    FileQuery,
    File,
    FileChange,
    ChangeDirection,
    Timecode,
    Tag,
    AutocompleteType,
    TimecodeTag
} from '../models';
import {
    map,
    switchMap,
    take,
    tap,
    distinctUntilChanged,
    shareReplay,
    filter
} from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { PlayerService, Progress } from '../player.service';
import { formatPreciseDurationWithMs } from '../pipes/precise-duration-with-ms.pipe';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DomSanitizer } from '@angular/platform-browser';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';

@Component({
    selector: 'app-file',
    templateUrl: './file.component.html',
    styleUrls: ['./file.component.scss']
})
export class FileComponent implements AfterViewInit {
    public file: File;
    public activeFile$: Observable<File>;

    public selectable = false;
    public removable = false;

    public allTagsShown = false;

    public timecodes: Timecode[];
    public tagStart: string;
    public tagEnd: string;

    public vlcIntentUrl: string;

    public AutocompleteType = AutocompleteType;

    public isMobile: boolean;

    @HostBinding('class.desktopHost')
    public isDesktop: boolean;

    public baseMediaPath = `${window.location.hostname}:${window.location.port}/media/`;

    @ViewChild('fileElement', { static: false })
    public fileElement: ElementRef<HTMLDivElement>;

    public videoPlayerStyle: any;

    public detectedScenes$: Observable<any[]>;
    public activeScene$: Observable<any>;

    @ViewChild('timecodesScroll', { static: false })
    private timecodesScroller: VirtualScrollerComponent;

    @ViewChild('scenesScroll', { static: false })
    private scenesScroller: VirtualScrollerComponent;

    public timecodeTags: { tags: Tag[] } = { tags: [] };

    constructor(
        private laputinService: LaputinService,
        private fileQueryService: FileQueryService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private playerService: PlayerService,
        private sanitizer: DomSanitizer,
        breakpointObserver: BreakpointObserver
    ) {
        this.activeFile$ = this.activatedRoute.params.pipe(
            map(params => params['hash']),
            map(hash => new FileQuery({ hash: hash })),
            switchMap(query => this.laputinService.queryFiles(query)),
            map(files => files[0]),
            tap(file => (this.file = file))
        );

        this.activeFile$
            .pipe(switchMap(file => this.laputinService.getTimecodes(file)))
            .subscribe(timecodes => (this.timecodes = timecodes));

        breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
            this.isMobile = result.matches;
            this.isDesktop = !this.isMobile;
        });

        this.detectedScenes$ = <Observable<any[]>>(
            this.activeFile$.pipe(
                switchMap(file => this.laputinService.getDetectedScenes(file))
            )
        );

        this.activeScene$ = combineLatest(
            this.detectedScenes$,
            this.playerService.progress$
        ).pipe(
            map(([scenes, progress]: [any[], Progress]) =>
                scenes.find(
                    s =>
                        s.startFrame <= progress.frame &&
                        progress.frame < s.endFrame
                )
            ),
            filter(scene => scene),
            distinctUntilChanged(),
            shareReplay(1)
        );

        this.activeScene$.subscribe(scene => {
            if (this.scenesScroller) {
                const itemIndex = this.scenesScroller.items.findIndex(
                    i => i.index === scene.index
                );
                if (itemIndex > -1) {
                    this.scenesScroller.scrollToIndex(
                        Math.max(0, itemIndex - 1)
                    );
                }
            }
        });
    }

    public ngAfterViewInit(): void {
        const width = this.fileElement.nativeElement.clientWidth;
        const height = Math.floor(width / (16 / 9));
        this.videoPlayerStyle = {
            width: width + 'px',
            'min-height': height + 'px',
            'max-height': height + 'px'
        };
    }

    public sanitize(url: string) {
        return this.sanitizer.bypassSecurityTrustUrl(url);
    }

    public changeActiveFile(fileChange: FileChange): void {
        this.fileQueryService.query$
            .pipe(
                switchMap(query => this.laputinService.queryFiles(query)),
                map(files => {
                    const activeIndex = files.findIndex(
                        f => f.hash === fileChange.currentFile.hash
                    );

                    let newIndex: number;
                    if (fileChange.random) {
                        newIndex = Math.floor(
                            Math.random() * (files.length - 1)
                        );
                    } else {
                        if (fileChange.direction === ChangeDirection.Previous) {
                            newIndex = activeIndex - 1;
                        } else {
                            newIndex = activeIndex + 1;
                        }
                    }

                    if (newIndex < 0 || newIndex >= files.length) {
                        return files[0];
                    }

                    return files[newIndex];
                }),
                take(1)
            )
            .subscribe(file => this.router.navigate(['/files', file.hash]));
    }

    public removeTimecode(timecode: Timecode): void {
        this.timecodes = this.timecodes.filter(
            t => t.timecodeId !== timecode.timecodeId
        );
    }

    public addTag(tag: Tag): void {
        this.addTags([tag]);
    }

    public addTags(tags: Tag[]): void {
        this.laputinService.addTags(this.file, tags).toPromise();
    }

    public removeTag(tag: Tag): void {
        this.laputinService.deleteTagFileAssoc(this.file, tag).toPromise();
    }

    public copy(): void {
        localStorage.setItem('tagClipboard', JSON.stringify(this.file.tags));
    }

    public paste(): void {
        const tags = JSON.parse(localStorage.getItem('tagClipboard'));
        this.addTags(tags);
    }

    public goToTimecode(timecode: Timecode): void {
        this.setCurrentTime(timecode.start);
    }

    public addTagsSelectionToTimecode(tags: Tag[]): void {
        const tagsMissingFromTimecode = [];
        tags.forEach(tag => {
            if (!this.timecodeTags.tags.find(t => t.id === tag.id)) {
                tagsMissingFromTimecode.push(tag);
            }
        });
        tagsMissingFromTimecode.forEach(tag =>
            this.timecodeTags.tags.push(tag)
        );
    }

    public addTimecodeTagToFile(tag: Tag): void {
        const alreadyAddedOnFile = this.file.tags.find(t => t.id === tag.id);
        if (!alreadyAddedOnFile) {
            this.addTag(tag);
        }
    }

    public setTagStart(): void {
        this.tagStart = formatPreciseDurationWithMs(
            this.playerService.player.currentTime
        );
    }

    public setTagEnd(): void {
        this.tagEnd = formatPreciseDurationWithMs(
            this.playerService.player.currentTime
        );
    }

    public goToTagStart(): void {
        if (!this.tagStart) {
            return;
        }

        this.setCurrentTime(
            this.convertFromSeparatedTimecodeToSeconds(this.tagStart)
        );
    }

    public goToTagEnd(): void {
        if (!this.tagEnd) {
            return;
        }

        this.setCurrentTime(
            this.convertFromSeparatedTimecodeToSeconds(this.tagEnd)
        );
    }

    public async saveTagTimecode(): Promise<void> {
        const tagStart = this.convertFromSeparatedTimecodeToSeconds(
            this.tagStart
        );
        const tagEnd = this.convertFromSeparatedTimecodeToSeconds(this.tagEnd);

        const selectedTimecodeTags = this.timecodeTags.tags.map(
            t => new TimecodeTag(null, null, t)
        );

        const tagTimecode = new Timecode(
            null,
            this.file.hash,
            this.file.path,
            selectedTimecodeTags,
            tagStart,
            tagEnd
        );
        const result = await this.laputinService
            .createTagTimecode(this.file, tagTimecode)
            .toPromise();
        this.addTagTimecode(result);
        this.file.tags = [
            ...new Set([...this.file.tags, ...this.timecodeTags.tags])
        ].sort((a, b) => {
            if (a.name > b.name) {
                return -1;
            } else if (a.name < b.name) {
                return 1;
            } else {
                return 0;
            }
        });

        this.timecodeTags.tags = [];
        this.tagStart = null;
        this.tagEnd = null;

        setTimeout(() => {
            if (this.timecodesScroller) {
                const foundItem = this.timecodesScroller.items.find(
                    i =>
                        i.hash === result.hash &&
                        i.timecodeId === result.timecodeId
                );
                this.timecodesScroller.scrollInto(foundItem);
            }
        });
    }

    public openFile(): void {
        this.laputinService
            .openFiles(new FileQuery({ hash: this.file.hash }))
            .toPromise();
    }

    public showFileInExplorer(): void {
        this.laputinService
            .showFileInExplorer(new FileQuery({ hash: this.file.hash }))
            .toPromise();
    }

    private convertFromSeparatedTimecodeToSeconds(
        separatedTimecode: string
    ): number {
        const components = separatedTimecode.split(':');
        return +components[0] * 3600 + +components[1] * 60 + +components[2];
    }

    private addTagTimecode(timecode: Timecode): void {
        const timecodes = this.timecodes.slice();
        timecodes.push(timecode);
        timecodes.sort((a, b) => {
            if (a.start < b.start) {
                return -1;
            } else if (a.start > b.start) {
                return 1;
            } else {
                return 0;
            }
        });
        this.timecodes = timecodes;
    }

    private setCurrentTime(newCurrentTime: number) {
        this.playerService.setCurrentTime(newCurrentTime);
    }

    public formattedTags(file: File): string {
        return file ? file.tags.map(tag => tag.name).join(', ') : null;
    }
}
