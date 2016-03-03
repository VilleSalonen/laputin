import {Component, OnInit} from "angular2/core";
import {HTTP_PROVIDERS, Headers} from "angular2/http";

import {File} from "./../models/file";
import {Tag} from "./../models/tag";
import {LaputinService} from "./../services/laputinservice";
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
    public term: string = "";
    
    constructor(private _service: LaputinService) {
    }
    
    ngOnInit(): void {
        this._service.getTags()
            .then((tags) => this.tags = tags);
    }
}