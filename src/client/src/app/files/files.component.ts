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
        this._service.openFiles(this.query);
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
}
