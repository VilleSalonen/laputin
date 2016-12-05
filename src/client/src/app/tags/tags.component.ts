import {Component, OnInit, Injectable, Inject} from "@angular/core";

import {File} from "./../models/file";
import {Tag} from "./../models/tag";
import {LaputinService} from "./../laputin.service";

@Component({
    template: `
        <search-box (update)="term = $event"></search-box>
        <ul>
            <li *ngFor="let tag of tags | tagfilter: term">
                <tag-row [tag]="tag"></tag-row>
            </li>
        </ul>
    `,
    providers: [LaputinService]
})
@Injectable()
export class TagsComponent implements OnInit {
    public tags: Tag[] = [];
    public term: string = "";
    
    constructor(@Inject(LaputinService) private _service: LaputinService) {
    }
    
    ngOnInit(): void {
        this._service.getTags()
            .then((tags) => this.tags = tags);
    }
}