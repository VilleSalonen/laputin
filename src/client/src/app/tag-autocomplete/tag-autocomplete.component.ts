import {Component, Input, Output, EventEmitter, ElementRef, Injectable, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs/Rx';
import * as _ from 'lodash';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import {Tag} from './../models/tag';
import {TagContainer} from './../models/tagcontainer';
import {FileQuery} from './../models/filequery';
import {LaputinService} from './../laputin.service';

@Component({
    selector: 'app-tag-autocomplete',
    styleUrls: ['./tag-autocomplete.component.scss'],
    template: `
        <div>
            <input
                    type="text"
                    [(ngModel)]="title"
                    [formControl]="termCtrl"
                    (keyup)="onKeyUp($event)"
                    (blur)="clear()"
                    placeholder="Tags">
            <div class="typeahead-list-container" *ngIf="matchingTags.length > 0">
                <ul class="typeahead-list" role="menu">
                    <li *ngFor="let tag of matchingTags; let i = index"
                        (click)="mouseSelection(tag)"
                        (mouseover)="selectedIndex = i"
                        [class]="selectedIndex == i ? 'hover' : ''">
                        {{tag.name}}
                    </li>
                </ul>
            </div>
        </div>
    `,
    providers: [LaputinService]
})
@Injectable()
export class TagAutocompleteComponent implements OnInit {
    public title = '';
    public selectedIndex = -1;

    public allTags: Tag[] = [];
    public matchingTags: Tag[] = [];

    public termCtrl = new FormControl();

    @Input() tagContainer: TagContainer;

    @Output()
    public select = new EventEmitter<Tag>();

    constructor(@Inject(LaputinService) private _service: LaputinService) {
        this.termCtrl.valueChanges
            .debounceTime(500)
            .distinctUntilChanged()
            .map((value: any) => <string> value)
            .subscribe((value: string) => this.onValueChange(value));
    }

    ngOnInit() {
        this._service.getTags().then((tags: Tag[]) => this.allTags = tags);
    }

    onValueChange(value: string): void {
        const searchTerm = value.toLowerCase();

        if (searchTerm.length === 0) { return; }
        if (!this.tagContainer) { return; }

        const alreadyAdded = _.map(this.tagContainer.tags, (tag: Tag) => tag.id);

        this.matchingTags =
            this.allTags
                .filter((tag: Tag) => _.indexOf(alreadyAdded, tag.id) === -1)
                .filter((tag: Tag) => tag.name.toLowerCase().includes(searchTerm))
                .slice(0, 10);
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

    private clear(): void {
        this.title = '';
        this.matchingTags = [];
        this.selectedIndex = -1;
    }
}
