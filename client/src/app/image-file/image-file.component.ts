import {
    Component,
    Input,
    OnDestroy,
    AfterViewInit,
    EventEmitter,
    Output,
    ElementRef,
    ViewChild,
} from '@angular/core';

import { File, ChangeDirection, FileChange } from './../models';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-image-file',
    templateUrl: './image-file.component.html',
    styleUrls: ['./image-file.component.scss'],
})
export class ImageFileComponent implements OnDestroy, AfterViewInit {
    private _file: File;

    @Input()
    get file(): File {
        return this._file;
    }
    set file(value: File) {
        this._file = value;
        this.imageSource = `/media/${this.file.fileId}`;
    }

    public imageSource: string;

    @Output()
    public fileChange: EventEmitter<FileChange> = new EventEmitter<
        FileChange
    >();

    private fileClosed: EventEmitter<void> = new EventEmitter<void>();

    public random: boolean;
    public isFullScreen: boolean;

    @ViewChild('imageViewer') imageViewer: ElementRef;

    ngOnDestroy(): void {
        this.close();
    }

    ngAfterViewInit() {
        const windowKeyups = fromEvent(window, 'keyup').pipe(
            takeUntil(this.fileClosed)
        );

        windowKeyups.subscribe((event: KeyboardEvent) => {
            if ((<any>event.srcElement).nodeName === 'INPUT') {
                if (event.key === 'Escape') {
                    (<any>event.srcElement).blur();
                }

                return;
            }

            switch (event.key) {
                case 'Enter':
                    if (event.altKey) {
                        this.toggleFullScreen();
                    }
                    break;
                case 'Escape':
                    if (this.isFullScreen) {
                        this.toggleFullScreen();
                    }
                    break;
                case 'a':
                    this.goToPrevious();
                    break;
                case 'd':
                    this.goToNext();
                    break;
                case 's':
                    this.toggleRandom();
                    break;
            }
        });
    }

    public toggleFullScreen(): void {
        if (this.isFullScreen) {
            (<any>document).webkitExitFullscreen();
        } else {
            this.imageViewer.nativeElement.webkitRequestFullScreen();
        }
    }

    public goToPrevious(): void {
        this.emitChange(ChangeDirection.Previous);
    }

    public goToNext(): void {
        this.emitChange(ChangeDirection.Next);
    }

    public toggleRandom(): void {
        this.random = !this.random;
    }

    private emitChange(direction: ChangeDirection): void {
        this.fileChange.emit(new FileChange(this.file, direction, this.random));
    }

    public close(): void {
        this.fileClosed.emit();
    }
}
