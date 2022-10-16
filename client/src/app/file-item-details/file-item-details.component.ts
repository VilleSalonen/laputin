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
    selector: 'app-file-item-details',
    styleUrls: ['./file-item-details.component.scss'],
    templateUrl: './file-item-details.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
@Injectable()
export class FileItemDetailsComponent implements OnInit {
    @Input()
    public file: File;

    public cacheBuster = '';
    public image: string;
    public imageStyle: any;

    public showMyElement: boolean;

    constructor(private service: LaputinService) {}

    public ngOnInit() {
        this.setImageUrl();

        this.imageStyle = {
            width: '356px',
            'min-width': '356px',
        };

        this.service.thumbnailChanged.subscribe((changed: File) => {
            if (changed.fileId === this.file.fileId) {
                this.cacheBuster = '?cachebuster=' + new Date().toISOString();
                this.setImageUrl();
            }
        });
    }

    private setImageUrl(): void {
        this.image = `/laputin/thumbs-small/${this.file.fileId}.jpg${this.cacheBuster}`;
    }

    public formattedTags(file: File): string {
        return file.tags.map((tag) => tag.name).join(', ');
    }
}
