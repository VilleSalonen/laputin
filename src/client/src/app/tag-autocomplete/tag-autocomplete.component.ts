import {
    Component,
    ElementRef,
    ViewChild,
    Input,
    Output,
    EventEmitter,
    OnInit,
    Injectable
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
    MatAutocompleteSelectedEvent,
    MatAutocomplete
} from '@angular/material/autocomplete';
import { debounceTime } from 'rxjs/operators';

import { Tag } from './../models/tag';
import { TagContainer } from './../models/tagcontainer';
import { LaputinService } from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';

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

    public selectable = false;
    public removable = true;
    public addOnBlur = false;
    public termCtrl = new FormControl();

    @ViewChild('termInput') termInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto') matAutocomplete: MatAutocomplete;

    @Input() tagContainer: TagContainer;
    @Input() include: Tag[] = [];
    @Input() type: AutocompleteType;

    @Output()
    public tagSelected = new EventEmitter<Tag>();
    @Output()
    public tagRemoved = new EventEmitter<Tag>();

    public AutocompleteType = AutocompleteType;

    public tagCreationAllowed = false;
    public searchTermOriginalForm: string;

    constructor(private _service: LaputinService) {
        this.termCtrl.valueChanges
            .pipe(debounceTime(500))
            .subscribe((value: string) => this.onValueChange(value));
    }

    public ngOnInit() {
        if (this.type === AutocompleteType.FileTagging) {
            // This will also contain tags which are not associated with any active files.
            this._service
                .getAllTags()
                .toPromise()
                .then((tags: Tag[]) => (this.allTags = tags));
        } else {
            this._service
                .getTags()
                .toPromise()
                .then((tags: Tag[]) => (this.allTags = tags));
        }

        this.tagCreationAllowed = this.type !== AutocompleteType.FileSearch;
    }

    public remove(tag: Tag): void {
        const index = this.tagContainer.tags.indexOf(tag);

        if (index >= 0) {
            this.tagContainer.tags.splice(index, 1);
            this.tagRemoved.emit(tag);
        }
    }

    public async onOptionSelected(event: MatAutocompleteSelectedEvent) {
        if (event && event.option && event.option.value) {
            if (
                event.option.value === 'create' &&
                this.searchTermOriginalForm
            ) {
                const tag = await this._service
                    .createTag(this.searchTermOriginalForm)
                    .toPromise();
                this.tagSelected.emit(tag);
                this.addToContainer(tag);
            } else {
                this.tagSelected.emit(event.option.value);
                this.addToContainer(event.option.value);
            }
        }

        this.clear();
    }

    public displayFn(tag?: Tag): string | undefined {
        return tag ? tag.name : undefined;
    }

    private onValueChange(value: string): void {
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

        const searchTermTrimmed = searchTerm.trim();

        const alreadyAdded = this.tagContainer.tags.map((tag: Tag) => tag.id);

        switch (this.type) {
            case AutocompleteType.FileSearch:
            case AutocompleteType.FileTagging:
                this.matchingTags = this.allTags
                    .filter((tag: Tag) => alreadyAdded.indexOf(tag.id) === -1)
                    .filter((tag: Tag) =>
                        tag.name.toLowerCase().includes(searchTermTrimmed)
                    )
                    .slice(0, 25);
                break;
            case AutocompleteType.FileTimecodeTagging:
                const fileTags = this.include.map((tag: Tag) => tag.id);

                this.matchingTags = this.include
                    .filter((tag: Tag) => alreadyAdded.indexOf(tag.id) === -1)
                    .filter((tag: Tag) =>
                        tag.name.toLowerCase().includes(searchTermTrimmed)
                    )
                    .slice(0, 25);
                this.otherTags = this.allTags
                    .filter((tag: Tag) => alreadyAdded.indexOf(tag.id) === -1)
                    .filter((tag: Tag) =>
                        tag.name.toLowerCase().includes(searchTermTrimmed)
                    )
                    .filter((tag: Tag) => fileTags.indexOf(tag.id) === -1)
                    .slice(0, 25);
                break;
            case AutocompleteType.ScreenshotTagging:
                this.matchingTags = this.include
                    .filter((tag: Tag) => alreadyAdded.indexOf(tag.id) === -1)
                    .filter((tag: Tag) =>
                        tag.name.toLowerCase().includes(searchTermTrimmed)
                    )
                    .slice(0, 25);
        }
    }

    public clear(): void {
        this.termInput.nativeElement.value = '';
        this.termCtrl.setValue(null);
        this.searchTermOriginalForm = '';
        this.matchingTags = [];
    }

    public onKeyUp($event: KeyboardEvent): void {
        const ESC = 27;

        if ($event.which === ESC) {
            this.clear();
        }
    }

    private addToContainer(tag: Tag): void {
        const currentTags = this.tagContainer.tags;
        currentTags.push(tag);
        const sorted = currentTags.sort((a, b) => (a.name > b.name ? 1 : -1));
        this.tagContainer.tags = sorted;
    }
}
