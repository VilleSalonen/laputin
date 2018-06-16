import {Component, OnInit, Injectable, Inject} from '@angular/core';
import * as _ from 'lodash';

import {File} from './../models/file';
import {FileChange, ChangeDirection} from './../models/filechange';
import {Tag} from './../models/tag';
import {FileQuery} from './../models/filequery';
import {LaputinService} from './../laputin.service';

@Component({
    styleUrls: ['./files.component.scss'],
    template: `
        <div class="container">
            <div class="files full-height">
                <div class="files-search">
                    <app-file-search (update)="filterFiles($event)"></app-file-search>

                    <h2 style="margin-top: 0; margin-bottom: 0;">
                        Showing {{files.length}} matching files
                        <a (click)="openFiles()" title="Open in external player">
                            <i class="fa fa-film" aria-hidden="true"></i>
                        </a>
                    </h2>
                </div>

                <div class="files-list" style="flex-grow: 1;">
                    <div [ngClass]="{'hidden': !loading}">
                        <i class="fa fa-spinner"></i>
                    </div>

                    <virtual-scroll [items]="files" (update)="viewPortItems = $event">
                        <div *ngFor="let file of viewPortItems" style="height: 160px; padding: 12px; direction: ltr;">
                            <app-file [file]="file" [active]="activeFile === file" (selected)="selectFile($event)"></app-file>
                        </div>
                    </virtual-scroll>
                </div>
            </div>

            <div class="player full-height">
                <app-video-player [file]="activeFile" (fileChange)="changeActiveFile($event)"></app-video-player>
            </div>
        </div>
    `
})
@Injectable()
export class FilesComponent implements OnInit {
    public activeFile: File;
    public files: File[] = [];
    public viewPortItems: File[] = [];
    public loading = false;
    private _query: FileQuery = new FileQuery();

    constructor(private _service: LaputinService) {
    }

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
            this.activeFile = this.files[0];
        } else {
            this.activeFile = this.files[newIndex];
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

            if (this.files) {
                this.activeFile = files[0];
            }

            this.loading = false;
        });
    }

    selectFile(file: File): void {
        this.activeFile = file;
    }
}
