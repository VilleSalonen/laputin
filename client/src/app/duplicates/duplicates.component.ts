import { Component, Injectable, Inject } from '@angular/core';

import { LaputinService } from './../laputin.service';
import { Duplicate } from './../models/duplicate';
import { File } from './../models/file';

@Component({
    styleUrls: ['./duplicates.component.scss'],
    templateUrl: './duplicates.component.html',
})
@Injectable()
export class DuplicatesComponent {
    public duplicates: Duplicate[] = [];
    public filteredDuplicates: Duplicate[] = [];

    constructor(@Inject(LaputinService) service: LaputinService) {
        service
            .getDuplicates()
            .toPromise()
            .then((duplicates: Duplicate[]) => {
                this.duplicates = duplicates;
                this.filteredDuplicates = duplicates;
            });
    }

    filter(term: string) {
        const termUpperCase = term.toUpperCase();
        this.filteredDuplicates = this.duplicates.filter((duplicate) =>
            duplicate.files.some(
                (file) => file.name.toUpperCase().indexOf(termUpperCase) >= 0
            )
        );
    }

    isExactMatch(files: File[], key: string, value: string): boolean {
        return files.every((file) => file.metadata.hashes[key] === value);
    }
}
