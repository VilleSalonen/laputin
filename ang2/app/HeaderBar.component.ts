import {Component} from 'angular2/core';

@Component({
    selector: 'header-bar',
    template: `
        <nav class="navbar navbar-inverse navbar-static-top" role="navigation">
            <div class="container-fluid">
                <div class="navbar-header">
                    <a class="navbar-brand" href="/#/">Laputin</a>
                </div>

                <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <ul class="nav navbar-nav">
                        <li><a href="/#/">Files</a></li>
                        <li><a href="/#/tags">Tags</a></li>
                        <li><a href="/#/duplicates">Duplicates</a></li>
                    </ul>
                </div>
            </div>
        </nav>
    `
})
export class HeaderBarComponent {
}

