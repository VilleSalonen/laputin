import {
    Component,
    Injectable,
    Input,
    OnInit,
    ChangeDetectionStrategy,
} from '@angular/core';

import { File } from './../models/file';
import { LaputinService } from './../laputin.service';

@Component({
    selector: 'app-file-item',
    styleUrls: ['./file-item.component.scss'],
    templateUrl: './file-item.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
@Injectable()
export class FileItemComponent implements OnInit {
    @Input()
    public file: File;

    public cacheBuster = '';
    public image: string;

    public showMyElement: boolean;

    public formattedTags: string = undefined;
    public cssClasses: string;

    constructor(private service: LaputinService) {}

    public ngOnInit() {
        this.setImageUrl();
        this.formattedTags = this.file.tags.map((tag) => tag.name).join(', ');
        if (this.file.type.startsWith('image')) {
            this.cssClasses = 'image-file';
        }

        this.service.thumbnailChanged.subscribe((changed: File) => {
            if (changed.hash === this.file.hash) {
                this.cacheBuster = '?cachebuster=' + new Date().toISOString();
                this.setImageUrl();
            }
        });
    }

    private setImageUrl(): void {
        this.image = `/laputin/thumbs-small/${this.file.hash}.jpg${this.cacheBuster}`;
    }
}
