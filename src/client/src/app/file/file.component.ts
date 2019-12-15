import { Component, Injectable, Input, OnInit } from '@angular/core';

import { File } from './../models/file';
import { LaputinService } from './../laputin.service';

@Component({
    selector: 'app-file',
    styleUrls: ['./file.component.scss'],
    templateUrl: './file.component.html'
})
@Injectable()
export class FileComponent implements OnInit {
    @Input()
    public file: File;

    public cacheBuster = '';
    public image: string;

    public showMyElement: boolean;

    constructor(service: LaputinService) {
        service.thumbnailChanged.subscribe((changed: File) => {
            if (changed.hash === this.file.hash) {
                this.cacheBuster = '?cachebuster=' + new Date().toISOString();
            }
        });
    }

    public ngOnInit() {
        this.image = `/laputin/thumbs-small/${this.file.hash}.jpg${this.cacheBuster}`;
    }

    public formattedTags(file: File): string {
        return file.tags.map(tag => tag.name).join(', ');
    }
}
