import {Component} from "angular2/core";
import {RouteConfig, ROUTER_DIRECTIVES} from "angular2/router";

import {FilesComponent} from "./files.component";
import {TagsComponent} from "./tags.component";
import {DuplicatesComponent} from "./duplicates.component";

@Component({
    selector: 'my-app',
    template: `
        <nav class="navbar navbar-inverse navbar-static-top" role="navigation">
            <div class="container-fluid">
                <div class="navbar-header">
                    <a class="navbar-brand" [routerLink]="['Files']">Laputin</a>
                </div>

                <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <ul class="nav navbar-nav">
                        <li><a [routerLink]="['Files']">Files</a></li>
                        <li><a [routerLink]="['Tags']">Tags</a></li>
                        <li><a [routerLink]="['Duplicates']">Duplicates</a></li>
                    </ul>
                </div>
            </div>
        </nav>

        <router-outlet></router-outlet>
    `,
    directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
    {path:'/', name: 'Files', component: FilesComponent, useAsDefault: true},
    {path:'/tags', name: 'Tags', component: TagsComponent},
    {path:'/duplicates', name: 'Duplicates', component: DuplicatesComponent}
])
export class AppComponent { }