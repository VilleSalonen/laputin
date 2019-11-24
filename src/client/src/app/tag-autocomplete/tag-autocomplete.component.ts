import {
    Component,
    Input,
    Output,
    EventEmitter,
    Injectable,
    Inject,
    OnInit
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { Tag } from './../models/tag';
import { TagContainer } from './../models/tagcontainer';
import { LaputinService } from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';
import { debounceTime, map } from 'rxjs/operators';

@Component({
    selector: 'app-tag-autocomplete',
    styleUrls: ['./tag-autocomplete.component.scss'],
    templateUrl: './tag-autocomplete.component.html',
    providers: [LaputinService]
})
@Injectable()
export class TagAutocompleteComponent implements OnInit {
    public allTags: Tag[] = [];
    public matchingTags: Tag[] = [];
    public otherTags: Tag[] = [];

    public termCtrl = new FormControl();

    @Input() tagContainer: TagContainer;
    @Input() exclude: Tag[] = [];
    @Input() type: AutocompleteType;

    @Output()
    public tagSelected = new EventEmitter<Tag>();

    public AutocompleteType = AutocompleteType;

    public tagCreationAllowed = false;
    public searchTermOriginalForm: string;

    constructor(@Inject(LaputinService) private _service: LaputinService) {
        this.termCtrl.valueChanges
            .pipe(debounceTime(500))
            .subscribe((value: string) => this.onValueChange(value));
    }

    ngOnInit() {
        if (this.type === AutocompleteType.FileTagging) {
            // This will also contain tags which are not associated with any active files.
            this._service
                .getAllTags()
                .then((tags: Tag[]) => (this.allTags = tags));
        } else {
            this._service
                .getTags()
                .then((tags: Tag[]) => (this.allTags = tags));
        }

        this.tagCreationAllowed = this.type !== AutocompleteType.FileSearch;
    }

    async onOptionSelected(event: any) {
        if (event && event.option && event.option.value) {
            if (
                event.option.value === 'create' &&
                this.searchTermOriginalForm
            ) {
                const tag = await this._service
                    .createTag(this.searchTermOriginalForm)
                    .toPromise();
                this.tagSelected.emit(tag);
            } else {
                this.tagSelected.emit(event.option.value);
            }
        }

        this.clear();
    }

    displayFn(tag?: Tag): string | undefined {
        return tag ? tag.name : undefined;
    }

    onValueChange(value: string): void {
        if (!value) {
            return;
        }
        if (!this.tagContainer) {
            return;
        }

        if (value.length === 0) {
            this.matchingTags = [];
            return;
        }

        const searchTerm = value.toLowerCase();

        const tagExistsWithSameName = this.allTags.find(
            (tag: Tag) => tag.name.toLowerCase() === searchTerm
        );

        if (!tagExistsWithSameName) {
            this.searchTermOriginalForm = value;
        } else {
            this.searchTermOriginalForm = '';
        }

        switch (this.type) {
            case AutocompleteType.FileSearch:
            case AutocompleteType.FileTagging:
                const alreadyAdded = this.tagContainer.tags.map(
                    (tag: Tag) => tag.id
                );

                this.matchingTags = this.allTags
                    .filter((tag: Tag) => alreadyAdded.indexOf(tag.id) === -1)
                    .filter((tag: Tag) =>
                        tag.name.toLowerCase().includes(searchTerm)
                    )
                    .slice(0, 10);
                break;
            case AutocompleteType.FileTimecodeTagging:
                const fileTags = this.tagContainer.tags.map(
                    (tag: Tag) => tag.id
                );
                const excludedTagIds = this.exclude.map((tag: Tag) => tag.id);

                this.matchingTags = this.tagContainer.tags
                    .filter((tag: Tag) =>
                        tag.name.toLowerCase().includes(searchTerm)
                    )
                    .filter((tag: Tag) => excludedTagIds.indexOf(tag.id) === -1)
                    .slice(0, 10);
                this.otherTags = this.allTags
                    .filter((tag: Tag) =>
                        tag.name.toLowerCase().includes(searchTerm)
                    )
                    .filter((tag: Tag) => fileTags.indexOf(tag.id) === -1)
                    .slice(0, 10);
                break;
        }
    }

    public clear(): void {
        this.termCtrl.setValue('');
        this.searchTermOriginalForm = '';
        this.matchingTags = [];
    }

    public onKeyUp($event: KeyboardEvent): void {
        const ESC = 27;

        if ($event.which === ESC) {
            this.clear();
        }
    }
}
