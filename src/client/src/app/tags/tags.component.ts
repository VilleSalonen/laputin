import { Component, OnInit, Injectable, Inject } from '@angular/core';

import { Tag } from './../models/tag';
import { LaputinService } from './../laputin.service';

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

    public term = '';

    constructor(@Inject(LaputinService) private _service: LaputinService) {}

    ngOnInit(): void {
        this.loading = true;
        this._service
            .getAllTags()
            .toPromise()
            .then(tags => {
                this.tags = tags;
                this.filteredTags = tags;
                this.loading = false;
            });
    }

    filter(term: string) {
        const termUpperCase = term.toUpperCase();
        this.filteredTags = this.tags.filter(
            tag => tag.name.toUpperCase().indexOf(termUpperCase) >= 0
        );
    }

    public onKeyUp($event: KeyboardEvent): void {
        const ENTER = 13;
        const ESC = 27;

        if ($event.which === ENTER) {
            this.filter(this.term);
        }

        if ($event.which === ESC) {
            this.term = '';
        }
    }
}
