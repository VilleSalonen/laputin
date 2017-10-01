import { Component } from '@angular/core';

@Component({
    selector: 'app-root',
    styleUrls: ['./app.component.scss'],
    template: `
        <nav class="nav" role="navigation">
            <ul class="nav">
                <li><a routerLink="/">Laputin</a></li>
                <li><a routerLink="/files">Files</a></li>
                <li><a routerLink="/tags">Tags</a></li>
                <li><a routerLink="/duplicates">Duplicates</a></li>
            </ul>
        </nav>

        <router-outlet></router-outlet>
    `
})
export class AppComponent {
}
