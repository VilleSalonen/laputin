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
            <div class="files">
                <div class="row full-height">
                    <div class="files-search full-height">
                        <app-file-search (update)="filterFiles($event)"></app-file-search>
                    </div>

                    <div class="files-list full-height">
                        <h2 style="margin-top: 0; margin-bottom: 24px;">
                            Showing {{files.length}} matching files
                            <a (click)="openFiles()" title="Open in external player">
                                <i class="fa fa-film" aria-hidden="true"></i>
                            </a>
                        </h2>

                        <table class="files-table">
                            <tbody>
                                <tr>
                                    <th>
                                    </th>
                                </tr>

                                <tr [hidden]="!loading" class="loading">
                                    <td><span class="fa fa-spinner" aria-hidden="true"></span></td>
                                </tr>

                                <tr *ngFor="let file of files">
                                    <td (click)="activeFile = file" [ngClass]="{'active-file': file == activeFile}">
                                        <div *ngIf="file == activeFile">
                                            <div>
                                                <p style="font-weight: 600; color: #e0e0e0;">
                                                    <span class="fa fa-arrow-circle-right" aria-hidden="true"></span>
                                                    {{file.path}}
                                                </p>
                                                <p>{{formattedTags(file)}}</p>
                                            </div>
                                        </div>
                                        <div *ngIf="file != activeFile">
                                            <div>
                                                <p style="color: #e0e0e0;">{{file.path}}</p>
                                                <p>{{formattedTags(file)}}</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="player">
                <app-video-player [file]="activeFile" (fileChange)="changeActiveFile($event)"></app-video-player>
            </div>
        </div>
    `,
    providers: [LaputinService]
})
@Injectable()
export class FilesComponent implements OnInit {
    public activeFile: File;
    public files: File[] = [];
    public loading = false;
    private _query: FileQuery = new FileQuery();

    constructor(@Inject(LaputinService) private _service: LaputinService) {
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

    public formattedTags(file: File): string {
        return _.map(file.tags, (tag) => tag.name).join(', ');
    }
}
