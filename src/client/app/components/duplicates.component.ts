import {Component, Injectable, Inject} from "angular2/core";
import {HTTP_PROVIDERS, Headers} from "angular2/http";

import {LaputinService} from "./../services/laputinservice";
import {Duplicate} from "./../models/duplicate";

@Component({
    template: `
        <h1>Duplicates</h1>
        
        <p ng-show="!duplicates.length">No duplicates found.</p>
        
        <ul>
            <li *ngFor="#duplicate of duplicates">
                {{duplicate.hash}}
                <ul>
                    <li *ngFor="#file of duplicate.files">
                        {{file.path}}
                    </li>
                </ul>
            </li>
        </ul>
    `,
    providers: [LaputinService, HTTP_PROVIDERS]
})
@Injectable()
export class DuplicatesComponent {
    public duplicates: Duplicate[];
    
    constructor(@Inject(LaputinService) private _service: LaputinService) {
        _service.getDuplicates().then((duplicates: Duplicate[]) => this.duplicates = duplicates);
    }
}