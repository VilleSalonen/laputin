import { Component } from '@angular/core';

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
                </ul>
            </nav>

            <div class="content">
                <router-outlet></router-outlet>
            </div>
        </div>
    `
})
export class AppComponent {
}
