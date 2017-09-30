import {Component, OnInit, Injectable, Inject} from '@angular/core';
import * as _ from 'lodash';

import {File} from './../models/file';
import {Tag} from './../models/tag';
import {LaputinService} from './../laputin.service';

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
                        Showing {{filteredTags.length}} matching tags
                    </th>
                </tr>

                <tr *ngFor="let tag of filteredTags">
                    <td>
                        <app-tag-row [tag]="tag"></app-tag-row>
                    </td>
                </tr>
            </tbody>
        </table>
    `,
    providers: [LaputinService]
})
@Injectable()
export class TagsComponent implements OnInit {
    public tags: Tag[] = [];
    public filteredTags: Tag[] = [];

    constructor(@Inject(LaputinService) private _service: LaputinService) {
    }

    ngOnInit(): void {
        this._service.getTags()
            .then((tags) => {
                this.tags = tags;
                this.filteredTags = tags;
            });
    }

    filter(term: string) {
        const termUpperCase = term.toUpperCase();
        this.filteredTags = _.filter(this.tags, (tag) => tag.name.toUpperCase().indexOf(termUpperCase) >= 0);
    }
}
