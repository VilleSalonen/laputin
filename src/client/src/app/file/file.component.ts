import {Component, Injectable, Input} from '@angular/core';
import * as _ from 'lodash';

import {File} from './../models/file';
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

    public cacheBuster: string;

    constructor(service: LaputinService) {
        service.thumbnailChanged.subscribe((changed: File) => {
            if (changed.hash === this.file.hash) {
                this.cacheBuster = '?cachebuster=' + (new Date().toISOString());
            }
        });
    }

    public formattedTags(file: File): string {
        return _.map(file.tags, (tag) => tag.name).join(', ');
    }
}
