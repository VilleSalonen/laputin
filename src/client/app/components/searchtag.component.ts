import {Component, Input, Output, EventEmitter} from "@angular/core";

import {Tag, TagStatus} from "../models/tag";

export class TagChange {
    constructor(public tag: Tag, public tagStatus: TagStatus) {
    }
}

@Component({
    selector: "search-tag",
    template: `
    <button class="dropdown-toggle btn {{tagClass}}" type="button" (click)="removeTag(tag)">
        <span>{{tag.name}} </span>
    </button>
    <button (click)="and()">AND</button>
    <button (click)="or()">OR</button>
    <button (click)="not()">NOT</button>
    `
})
export class SearchTag {
    @Input() public tag: Tag;

    @Output() public removed: EventEmitter<Tag> = new EventEmitter<Tag>();
    @Output() public changed: EventEmitter<TagChange> = new EventEmitter<TagChange>();

    public tagClass: string = "btn-success";

    private removeTag(tag: Tag): void {
        this.removed.emit(tag);
    }
    
    private and(): void {
        this.changed.emit(new TagChange(this.tag, TagStatus.And));
    }

    private or(): void {
        this.tagClass = "btn-warning";
        this.changed.emit(new TagChange(this.tag, TagStatus.Or));
    }

    private not(): void {
        this.tagClass = "btn-danger";
        this.changed.emit(new TagChange(this.tag, TagStatus.Not));
    }
}