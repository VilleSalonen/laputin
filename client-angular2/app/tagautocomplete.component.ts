import {Component, Output, EventEmitter, ElementRef} from "angular2/core";
import {Control} from 'angular2/common';
import {Observable} from 'rxjs/Rx';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import {Tag} from "./tag";
import {LaputinService} from "./laputinservice";

@Component({
    selector: "tag-autocomplete",
    template: `
    <div>
        <input class="typeahead-input form-control"
               [(ngModel)]="title"
               [ngFormControl]="term"
               (keyup)="onKeyUp($event)" />
        <div class="typeahead-list-container" *ngIf="matchingTags.length > 0">
            <ul class="typeahead-list" role="menu">
                <li *ngFor="#tag of matchingTags; #i = index"
                    [class]="selectedIndex == i ? 'hover' : ''"
                    (click)="mouseSelection(tag)">
                    {{tag.name}}
                </li>
            </ul>
        </div>
    </div>`
})
export class TagAutocompleteComponent {
    public title: string = "";
    public selectedIndex: number = -1;
    
    public allTags: Tag[] = [];
    public matchingTags: Tag[] = [];
    
    public term = new Control();
    
    @Output()
    public select = new EventEmitter<Tag>();
    
    constructor(private _service: LaputinService) {
        this._service.tags.subscribe((tags: Tag[]) => this.allTags = tags);

        this.term.valueChanges
            .debounceTime(500)
            .distinctUntilChanged()
            .map((value: any) => <string> value)
            .subscribe((value: string) => this.onValueChange(value));
    }
    
    onValueChange(value: string): void {
        let searchTerm = this.title.toLowerCase();

        if (searchTerm.length == 0) {
            return;
        }

        this.matchingTags = 
            this.allTags
                .filter((tag: Tag) => tag.name.toLowerCase().includes(searchTerm))
                .slice(0, 10);
    }
    
    mouseSelection(tag: Tag): void {
        this.select.emit(tag);
        this.clear();
    }
    
    onKeyUp($event: KeyboardEvent): void {
        const UP: number = 38;
        const DOWN: number = 40;
        const ENTER: number = 13;
        const ESC: number = 27;
        
        if ($event.which == UP && this.selectedIndex > 0) {
            this.selectedIndex--;
        }
        
        if ($event.which == DOWN && this.selectedIndex < this.matchingTags.length - 1) {
            this.selectedIndex++;
        }
        
        if ($event.which == ENTER && this.selectedIndex >= 0 && this.selectedIndex < this.matchingTags.length) {
            this.select.emit(this.matchingTags[this.selectedIndex]);
            this.clear();
        }
        
        if ($event.which == ESC) {
            this.clear();
        }
    }
    
    private clear(): void {
        this.title = "";
        this.matchingTags = [];
        this.selectedIndex = -1;
    }
}