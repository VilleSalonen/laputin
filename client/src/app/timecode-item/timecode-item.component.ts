import {
    Component,
    Injectable,
    Input,
    OnInit,
    ChangeDetectionStrategy
} from '@angular/core';

import { LaputinService } from './../laputin.service';
import { Timecode } from '../models';

@Component({
    selector: 'app-timecode-item',
    styleUrls: ['./timecode-item.component.scss'],
    templateUrl: './timecode-item.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
@Injectable()
export class TimecodeItemComponent implements OnInit {
    @Input()
    public timecode: Timecode;

    public cacheBuster = '';
    public image: string;

    public showMyElement: boolean;

    constructor(private service: LaputinService) {
        this.service.timecodeThumbnailChanged.subscribe((changed: Timecode) => {
            if (changed.timecodeId === this.timecode.timecodeId) {
                this.cacheBuster = '?cachebuster=' + new Date().toISOString();
                this.setImageUrl();
            }
        });
    }

    public ngOnInit() {
        this.setImageUrl();
    }

    private setImageUrl(): void {
        this.image = `/laputin/tag-timecode-thumbs-small/${this.timecode.timecodeId}.jpg${this.cacheBuster}`;
    }

    public formattedTags(timecode: Timecode): string {
        return timecode.timecodeTags
            .map(timecodeTag => timecodeTag.tag.name)
            .join(', ');
    }
}
