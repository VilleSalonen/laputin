import { Component, OnInit, Injectable, Inject } from '@angular/core';
import * as _ from 'lodash';

import { File } from './../models/file';
import { FileChange, ChangeDirection } from './../models/filechange';
import { Tag } from './../models/tag';
import { FileQuery } from './../models/filequery';
import { LaputinService } from './../laputin.service';
import { PlayerService } from '../player.service';

@Component({
    styleUrls: ['./files.component.scss'],
    templateUrl: './files.component.html'
})
@Injectable()
export class FilesComponent implements OnInit {
    public activeFile: File;
    public files: File[] = [];
    public viewPortItems: File[] = [];
    public loading = false;
    private _query: FileQuery = new FileQuery();

    constructor(
        private _service: LaputinService,
        private _playerService: PlayerService
    ) {}

    ngOnInit(): void {
        this.loadFiles();
    }

    changeActiveFile(fileChange: FileChange): void {
        const activeIndex = this.files.indexOf(this.activeFile);

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
        this._query = query;
        this.loadFiles();
    }

    openFiles(): void {
        this._service.openFiles(this._query);
    }

    loadFiles(): void {
        this.files = [];
        this.loading = true;
        this._service.queryFiles(this._query).then((files: File[]) => {
            this.files = files;
            this.loading = false;
        });
    }

    selectFile(file: File): void {
        this.activeFile = file;
        this._playerService.setPlayingFile(file);
    }

    closeFile(): void {
        this.activeFile = null;
        this._playerService.setPlayingFile(null);
    }
}
