import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { File } from '../models';

@Component({
    selector: 'app-scene',
    templateUrl: 'scene.component.html',
    styleUrls: ['./scene.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SceneComponent {
    @Input()
    public file: File;
    @Input()
    public scene: any;
    @Input()
    public active: any;
}
