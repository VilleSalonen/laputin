import { Component, OnInit, Injectable, OnDestroy } from '@angular/core';

import { File } from './../models/file';
import { FileChange, ChangeDirection } from './../models/filechange';
import { FileQuery } from './../models/filequery';
import { LaputinService } from './../laputin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';

@Component({
    styleUrls: ['./files.component.scss'],
    templateUrl: './files.component.html'
})
@Injectable()
export class FilesComponent implements OnInit, OnDestroy {
    public allFilesSubscription: Subject<File[]> = new Subject<File[]>();
    public filesSubscription: Subject<File[]> = new Subject<File[]>();
    public hashParamSubscription: Subject<string> = new Subject<string>();

    public activeFile: File;
    public allFiles: File[] = [];
    public files: File[] = [];
    public loading = false;
    public query: FileQuery;
    public totalDuration: string;
    public totalSize: string;

    private sub: any;

    constructor(
        private _service: LaputinService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.query = new FileQuery(JSON.parse(localStorage.getItem('query')));

        this.filesSubscription.subscribe((files: File[]) => {
            this.allFiles = files;
            this.files = files.slice(0, 100);
        });

        this._service
            .queryFiles(new FileQuery())
            .toPromise()
            .then((files: File[]) => {
                this.allFilesSubscription.next(files);
            });

        combineLatest(
            this.filesSubscription,
            this.allFilesSubscription,
            this.hashParamSubscription
        ).subscribe(([files, allFiles, hashParam]) => {
            if (hashParam) {
                let selectedFile = files.find(f => f.hash === hashParam);
                if (!selectedFile) {
                    selectedFile = allFiles.find(f => f.hash === hashParam);
                }

                if (selectedFile) {
                    this.selectFile(selectedFile);
                }
            } else {
                this.closeFile();
            }
        });

        this.loadFiles();

        this.sub = this.route.params.subscribe(params => {
            this.hashParamSubscription.next(params['hash']);
        });
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    changeActiveFile(fileChange: FileChange): void {
        const activeIndex = this.allFiles.indexOf(fileChange.currentFile);

        let newIndex: number;
        if (fileChange.random) {
            newIndex = Math.floor(Math.random() * (this.allFiles.length - 1));
        } else {
            if (fileChange.direction === ChangeDirection.Previous) {
                newIndex = activeIndex - 1;
            } else {
                newIndex = activeIndex + 1;
            }
        }

        if (newIndex < 0 || newIndex >= this.allFiles.length) {
            this.selectFile(this.allFiles[0]);
        } else {
            this.selectFile(this.allFiles[newIndex]);
        }
    }

    filterFiles(query: FileQuery): void {
        this.query = query;
        this.loadFiles();
    }

    openFiles(): void {
        this._service.openFiles(this.query).toPromise();
    }

    loadFiles(): void {
        this.filesSubscription.next([]);
        this.loading = true;
        this._service
            .queryFiles(this.query)
            .toPromise()
            .then((files: File[]) => {
                localStorage.setItem('query', JSON.stringify(this.query));
                this.filesSubscription.next(files);
                let totalSeconds = 0.0;
                let totalSize = 0.0;
                files.forEach(f => {
                    const duration = parseFloat(f.metadata.duration);
                    if (!isNaN(duration)) {
                        totalSeconds += parseFloat(f.metadata.duration);
                    }
                    totalSize += f.size;
                });

                this.totalDuration = this.humanDuration(totalSeconds);
                this.totalSize = this.humanFileSize(totalSize);

                this.loading = false;
            });
    }

    selectFile(file: File): void {
        this.activeFile = file;

        if (file) {
            this.router.navigate(['/files', file.hash]);
        }
    }

    closeFile(): void {
        this.router.navigate(['/files']);
    }

    showMore(): void {
        this.files = this.allFiles.slice(0, this.files.length + 100);
    }

    humanDuration(seconds: number): string {
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

    humanFileSize(bytes: number): string {
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
