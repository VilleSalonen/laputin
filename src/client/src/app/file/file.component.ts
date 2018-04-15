import {Component, OnInit, Injectable, Inject, Input, EventEmitter, Output} from '@angular/core';
import * as _ from 'lodash';

import {File} from './../models/file';
import {FileChange, ChangeDirection} from './../models/filechange';
import {Tag} from './../models/tag';
import {FileQuery} from './../models/filequery';
import {LaputinService} from './../laputin.service';

@Component({
    selector: 'app-file',
    styleUrls: ['./file.component.scss'],
    templateUrl: './file.component.html'
})
@Injectable()
export class FileComponent {
    @Input()
    public file: File;

    @Input()
    public active: boolean;

    @Output()
    public selected: EventEmitter<File> = new EventEmitter<File>();

    public cacheBuster: string;

    constructor(private _service: LaputinService) {
        console.log(_service);
        _service.thumbnailChanged.subscribe((changed: File) => {
            console.log(changed);
            if (changed.hash === this.file.hash) {
                this.cacheBuster = '?cachebuster=' + (new Date().toISOString());
            }
        });
    }

    public formattedTags(file: File): string {
        return _.map(file.tags, (tag) => tag.name).join(', ');
    }

    public select(): void {
        this.selected.emit(this.file);
    }
}
