import {Component, Input, Output, EventEmitter} from '@angular/core';

import {Tag, TagStatus} from '../models/tag';

export class TagChange {
    constructor(public tag: Tag, public tagStatus: TagStatus) {
    }
}

@Component({
    selector: 'app-search-tag',
    styleUrls: ['./search-tag.component.scss'],
    template: `
    <div class="btn-group {{tagClass}}">
        <a class="btn" (click)="removeTag()">{{tag.name}}</a>
        <a class="btn" (click)="toggle()">
            V
        </a>

        <ul class="dropdown-menu" [ngClass]="{ 'open': isOpen, 'closed': !isOpen }">
            <li><a (click)="and()">Must contain</a></li>
            <li><a (click)="or()">Can contain</a></li>
            <li><a (click)="not()">Does not contain</a></li>
        </ul>
    </div>
    `
})
export class SearchTagComponent {
    @Input() public tag: Tag;

    @Output() public removed: EventEmitter<Tag> = new EventEmitter<Tag>();
    @Output() public changed: EventEmitter<TagChange> = new EventEmitter<TagChange>();

    public tagClass = 'must-contain';
    public isOpen = false;

    public toggle(): void {
        this.isOpen = !this.isOpen;
    }

    private removeTag(): void {
        this.removed.emit(this.tag);
    }

    private and(): void {
        this.tagClass = 'must-contain';
        this.changed.emit(new TagChange(this.tag, TagStatus.And));
    }

    private or(): void {
        this.tagClass = 'can-contain';
        this.changed.emit(new TagChange(this.tag, TagStatus.Or));
    }

    private not(): void {
        this.tagClass = 'does-not-contain';
        this.changed.emit(new TagChange(this.tag, TagStatus.Not));
    }
}
