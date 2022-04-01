import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { File } from '../models';
import { PlayerService } from '../player.service';

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

    constructor(private playerService: PlayerService) {}

    public goToSceneStart(): void {
        this.setCurrentFrame(this.scene.startFrame);
    }

    public goToSceneEnd(): void {
        this.setCurrentFrame(this.scene.endFrame - 1);
    }

    private setCurrentFrame(newFrame: number) {
        this.playerService.setCurrentFrame(newFrame);
    }
}
