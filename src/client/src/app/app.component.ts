import { Component } from '@angular/core';
import { PlayerService } from './player.service';
import { File } from './models/file';

@Component({
    selector: 'app-root',
    styleUrls: ['./app.component.scss'],
    template: `
        <div class="maincontainer">
            <nav role="navigation">
                <ul class="nav">
                    <li><a routerLink="/">Laputin</a></li>
                    <li><a routerLink="/files">Files</a></li>
                    <li><a routerLink="/timecodes">Timecodes</a></li>
                    <li><a routerLink="/tags">Tags</a></li>
                    <li><a routerLink="/duplicates">Duplicates</a></li>

                    <li *ngIf="currentFile" class="current-file">
                        <i class="far fa-play-circle" aria-hidden="true"></i>
                        <span>{{ currentFile.directory() }}</span>
                        <span class="highlight">{{ currentFile.nameSansSuffix() }}</span>
                        <span>{{ currentFile.suffix() }}</span>
                    </li>
                </ul>
            </nav>

            <div class="content">
                <router-outlet></router-outlet>
            </div>
        </div>
    `
})
export class AppComponent {
    public currentFile: File;

    constructor(private _playerService: PlayerService) {
        _playerService.filePlaying.subscribe((file: File) => {
            this.currentFile = file;
        });
    }
}
