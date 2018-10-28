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
    public filteredOrphanedTags: Tag[] = [];
    public loading: boolean;

    constructor(@Inject(LaputinService) private _service: LaputinService) {
    }

    ngOnInit(): void {
        this.loading = true;
        this._service.getAllTags()
            .then((tags) => {
                this.tags = tags;
                this.filteredTags = tags.filter(t => t.associationCount > 0);
                this.filteredOrphanedTags = tags.filter(t => t.associationCount === 0);
                this.loading = false;
            });
    }

    filter(term: string) {
        const termUpperCase = term.toUpperCase();
        const searchTermMatches = this.tags.filter((tag) => tag.name.toUpperCase().indexOf(termUpperCase) >= 0);
        this.filteredTags = searchTermMatches.filter((tag) => tag.associationCount > 0);
        this.filteredOrphanedTags = searchTermMatches.filter((tag) => tag.associationCount === 0);
    }
}
