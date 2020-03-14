// Uncomment to enable rxjs-spy
// import { create } from 'rxjs-spy';

import { Component } from '@angular/core';
import { LaputinService } from './laputin.service';
import { Duplicate } from './models';
import { Observable } from 'rxjs';

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
                    <ng-container *ngIf="duplicates$ | async as duplicates">
                        <li *ngIf="duplicates.length > 0">
                            <a routerLink="/duplicates"
                                >Duplicates ({{ duplicates.length }})</a
                            >
                        </li>
                    </ng-container>
                </ul>
            </nav>

            <div class="content">
                <router-outlet></router-outlet>
            </div>
        </div>
    `
})
export class AppComponent {
    public duplicates$: Observable<Duplicate[]>;

    constructor(laputinService: LaputinService) {
        // Uncomment to enable rxjs-spy
        // const spy = create();
        // spy.log();

        this.duplicates$ = laputinService.getDuplicates();
    }
}
