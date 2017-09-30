import {Component, Injectable, Inject} from '@angular/core';
import * as _ from 'lodash';

import {LaputinService} from './../laputin.service';
import {Duplicate} from './../models/duplicate';

@Component({
    template: `
        <div class="filter-controls" style="margin-top: -20px; margin-bottom: 0px;">
            <div class="extra-padded">
                <div class="row">
                    <div class="col-md-6">
                        <form class="form-horizontal">
                            <div class="form-group col-md-4">
                                <label class="col-sm-2 control-label">Name</label>
                                <div class="col-sm-10">
                                    <div>
                                        <app-search-box (update)="filter($event)"></app-search-box>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <table class="table table-striped">
            <tbody>
                <tr>
                    <th>
                        <span [hidden]="duplicates.length == 0">Showing {{filteredDuplicates.length}} matching duplicates</span>
                        <span [hidden]="duplicates.length > 0">No duplicates found.</span>
                    </th>
                </tr>

                <tr *ngFor="let duplicate of filteredDuplicates">
                    <td>
                        {{duplicate.hash}}
                        <ul>
                            <li *ngFor="let file of duplicate.files">
                                {{file.path}}
                            </li>
                        </ul>
                    </td>
                </tr>
            </tbody>
        </table>
    `,
    providers: [LaputinService]
})
@Injectable()
export class DuplicatesComponent {
    public duplicates: Duplicate[] = [];
    public filteredDuplicates: Duplicate[] = [];

    constructor(@Inject(LaputinService) private _service: LaputinService) {
        _service.getDuplicates().then((duplicates: Duplicate[]) => {
            this.duplicates = duplicates;
            this.filteredDuplicates = duplicates;
        });
    }

    filter(term: string) {
        const termUpperCase = term.toUpperCase();
        this.filteredDuplicates = _.filter(
            this.duplicates,
            (duplicate) =>
                _.some(duplicate.files, (file) => file.name.toUpperCase().indexOf(termUpperCase) >= 0));
    }
}
