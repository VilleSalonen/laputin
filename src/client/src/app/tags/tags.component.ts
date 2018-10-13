import {Component, OnInit, Injectable, Inject} from '@angular/core';
import * as _ from 'lodash';

import {Tag} from './../models/tag';
import {LaputinService} from './../laputin.service';

@Component({
    styleUrls: ['./tags.component.scss'],
    templateUrl: './tags.component.html'
})
@Injectable()
export class TagsComponent implements OnInit {
    public tags: Tag[] = [];
    public filteredTags: Tag[] = [];
    public loading: boolean;

    constructor(@Inject(LaputinService) private _service: LaputinService) {
    }

    ngOnInit(): void {
        this.loading = true;
        this._service.getAllTags()
            .then((tags) => {
                this.tags = tags;
                this.filteredTags = tags;
                this.loading = false;
            });
    }

    filter(term: string) {
        const termUpperCase = term.toUpperCase();
        this.filteredTags = _.filter(this.tags, (tag) => tag.name.toUpperCase().indexOf(termUpperCase) >= 0);
    }
}
