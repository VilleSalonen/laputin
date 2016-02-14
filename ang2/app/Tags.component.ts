import {Component, OnInit} from "angular2/core";
import {HTTP_PROVIDERS, Headers} from "angular2/http";

import {File} from "./file";
import {Tag} from "./tag";
import {LaputinService} from "./laputinservice";
import {TagsPipe} from "./tagspipe";
import {SearchBox} from "./searchbox.component";

@Component({
    pipes: [TagsPipe],
    template: `
        <search-box (update)="term = $event"></search-box>
        <ul>
            <li *ngFor="#tag of tags | tagfilter: term">{{tag.name}}</li>
        </ul>
    `,
    providers: [LaputinService, HTTP_PROVIDERS],
    directives: [SearchBox]
})
export class TagsComponent implements OnInit {
    public tags: Tag[] = [];
    
    constructor(private _service: LaputinService) {
    }
    
    ngOnInit(): void {
        this._service.tags.subscribe((tags: Tag[]) => { this.tags = tags; });
    }
}