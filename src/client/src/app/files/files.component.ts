import { Component, OnInit, Injectable, Inject, OnDestroy } from '@angular/core';
import * as _ from 'lodash';

import { File } from './../models/file';
import { FileChange, ChangeDirection } from './../models/filechange';
import { Tag } from './../models/tag';
import { FileQuery } from './../models/filequery';
import { LaputinService } from './../laputin.service';
import { PlayerService } from '../player.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { combineLatest } from 'rxjs/observable/combineLatest';

@Component({
    styleUrls: ['./files.component.scss'],
    templateUrl: './files.component.html'
})
@Injectable()
export class FilesComponent implements OnInit, OnDestroy {
    public filesSubscription: Subject<File[]> = new Subject<File[]>();
    public hashParamSubscription: Subject<string> = new Subject<string>();

    public activeFile: File;
    public files: File[] = [];
    public viewPortItems: File[] = [];
    public loading = false;
    private query: FileQuery;

    private sub: any;

    constructor(
        private _service: LaputinService,
        private _playerService: PlayerService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.query = new FileQuery(JSON.parse(localStorage.getItem('query')));

        this.filesSubscription.subscribe((files: File[]) =>
            this.files = files
        );

        this.filesSubscription.combineLatest(this.hashParamSubscription)
        .subscribe(([files, hashParam]) => {
            if (hashParam) {
               const selectedFile = _.find(files, f => f.hash === hashParam);
               this.selectFile(selectedFile);
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
        const activeIndex = this.files.indexOf(fileChange.currentFile);

        let newIndex: number;
        if (fileChange.random) {
            newIndex = _.random(0, this.files.length - 1);
        } else {
            if (fileChange.direction === ChangeDirection.Previous) {
                newIndex = activeIndex - 1;
            } else {
                newIndex = activeIndex + 1;
            }
        }

        if (newIndex < 0 || newIndex >= this.files.length) {
            this.selectFile(this.files[0]);
        } else {
            this.selectFile(this.files[newIndex]);
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
        this._service.queryFiles(this.query).then((files: File[]) => {
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
}
