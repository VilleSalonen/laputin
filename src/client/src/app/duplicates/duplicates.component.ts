import {Component, Injectable, Inject} from '@angular/core';
import * as _ from 'lodash';

import {LaputinService} from './../laputin.service';
import {Duplicate} from './../models/duplicate';

@Component({
    styleUrls: ['./duplicates.component.scss'],
    templateUrl: './duplicates.component.html'
})
@Injectable()
export class DuplicatesComponent {
    public duplicates: Duplicate[] = [];
    public filteredDuplicates: Duplicate[] = [];

    constructor(@Inject(LaputinService) service: LaputinService) {
        service.getDuplicates().then((duplicates: Duplicate[]) => {
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
