import {Component, Input, Output, EventEmitter} from "@angular/core";

import {Tag, TagStatus} from "../models/tag";

export class TagChange {
    constructor(public tag: Tag, public tagStatus: TagStatus) {
    }
}

@Component({
    selector: "search-tag",
    template: `
    <div class="btn-group">
        <button type="button" class="{{tagClass}} btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {{tag.name}}
        </button>
        <ul class="dropdown-menu">
            <li><a (click)="and()">Must contain</a></li>
            <li><a (click)="or()">Can contain</a></li>
            <li><a (click)="not()">Does not contain</a></li>
        </ul>
    </div>
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
        this.tagClass = "btn-success";
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