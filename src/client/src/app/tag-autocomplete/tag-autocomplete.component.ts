import {Component, Input, Output, EventEmitter, Injectable, Inject, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import * as _ from 'lodash';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import {Tag} from './../models/tag';
import {TagContainer} from './../models/tagcontainer';
import {LaputinService} from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';

@Component({
    selector: 'app-tag-autocomplete',
    styleUrls: ['./tag-autocomplete.component.scss'],
    templateUrl: './tag-autocomplete.component.html',
    providers: [LaputinService]
})
@Injectable()
export class TagAutocompleteComponent implements OnInit {
    public selectedIndex = -1;

    public allTags: Tag[] = [];
    public matchingTags: Tag[] = [];

    public termCtrl = new FormControl();

    @Input() tagContainer: TagContainer;
    @Input() exclude: Tag[];
    @Input() type: AutocompleteType;

    @Output()
    public select = new EventEmitter<Tag>();

    constructor(@Inject(LaputinService) private _service: LaputinService) {
        this.termCtrl.valueChanges
            .debounceTime(500)
            .map((value: any) => <string> value)
            .subscribe((value: string) => this.onValueChange(value));
    }

    ngOnInit() {
        if (this.type === AutocompleteType.FileTagging) {
            // This will also contain tags which are not associated with any active files.
            this._service.getAllTags().then((tags: Tag[]) => this.allTags = tags);
        } else {
            this._service.getTags().then((tags: Tag[]) => this.allTags = tags);
        }
    }

    onValueChange(value: string): void {
        const searchTerm = value.toLowerCase();

        if (!this.tagContainer) { return; }
        if (searchTerm.length === 0) {
            this.matchingTags = [];
            return;
        }

        switch (this.type) {
            case AutocompleteType.FileSearch:
            case AutocompleteType.FileTagging:
                const alreadyAdded = _.map(this.tagContainer.tags, (tag: Tag) => tag.id);

                this.matchingTags =
                    this.allTags
                        .filter((tag: Tag) => _.indexOf(alreadyAdded, tag.id) === -1)
                        .filter((tag: Tag) => tag.name.toLowerCase().includes(searchTerm))
                        .slice(0, 10);
                break;
            case AutocompleteType.FileTimecodeTagging:
                const excludedTagIds = _.map(this.exclude, (tag: Tag) => tag.id);

                this.matchingTags =
                    this.tagContainer.tags
                        .filter((tag: Tag) => tag.name.toLowerCase().includes(searchTerm))
                        .filter((tag: Tag) => _.indexOf(excludedTagIds, tag.id) === -1)
                        .slice(0, 10);
                break;
        }
    }

    mouseSelection(tag: Tag): void {
        this.select.emit(tag);
        this.clear();
    }

    onKeyUp($event: KeyboardEvent): void {
        const UP = 38;
        const DOWN = 40;
        const ENTER = 13;
        const ESC = 27;

        if ($event.which === UP && this.selectedIndex > 0) {
            this.selectedIndex--;
        }

        if ($event.which === DOWN && this.selectedIndex < this.matchingTags.length - 1) {
            this.selectedIndex++;
        }

        if ($event.which === ENTER && this.selectedIndex >= 0 && this.selectedIndex < this.matchingTags.length) {
            this.select.emit(this.matchingTags[this.selectedIndex]);
            this.clear();
        }

        if ($event.which === ESC) {
            this.clear();
        }
    }

    public clear(): void {
        this.termCtrl.setValue('');
        this.matchingTags = [];
        this.selectedIndex = -1;
    }
}
