import {Component, Injectable, Inject} from "@angular/core";

import {LaputinService} from "./../laputin.service";
import {Duplicate} from "./../models/duplicate";

@Component({
    template: `
        <h1>Duplicates</h1>
        
        <p [hidden]="duplicates.length > 0">No duplicates found.</p>
        
        <ul>
            <li *ngFor="let duplicate of duplicates">
                {{duplicate.hash}}
                <ul>
                    <li *ngFor="let file of duplicate.files">
                        {{file.path}}
                    </li>
                </ul>
            </li>
        </ul>
    `,
    providers: [LaputinService]
})
@Injectable()
export class DuplicatesComponent {
    public duplicates: Duplicate[] = [];
    
    constructor(@Inject(LaputinService) private _service: LaputinService) {
        _service.getDuplicates().then((duplicates: Duplicate[]) => this.duplicates = duplicates);
    }
}