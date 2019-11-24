import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Tag, TagStatus } from '../models';

export class TagChange {
    constructor(public tag: Tag, public tagStatus: TagStatus) {}
}

@Component({
    selector: 'app-search-tag',
    styleUrls: ['./search-tag.component.scss'],
    template: `
        <div class="tag {{ tagClass }}">
            <a (click)="removeTag()">{{ tag.name }}</a>
            <a class="dropdown-btn" (click)="toggle()">
                <span class="fa fa-chevron-down" aria-hidden="true"></span>
            </a>

            <ul [ngClass]="{ open: isOpen, closed: !isOpen }">
                <li>
                    <a (click)="and()"
                        ><span
                            class="fa fa-check-circle must-contain"
                            aria-hidden="true"
                        ></span>
                        Must contain</a
                    >
                </li>
                <li>
                    <a (click)="or()"
                        ><span
                            class="fa fa-question-circle can-contain"
                            aria-hidden="true"
                        ></span>
                        Can contain</a
                    >
                </li>
                <li>
                    <a (click)="not()"
                        ><span
                            class="fa fa-ban does-not-contain"
                            aria-hidden="true"
                        ></span>
                        Does not contain</a
                    >
                </li>
            </ul>
        </div>
    `
})
export class SearchTagComponent {
    @Input() public tag: Tag;
    @Input() public tagClass: string;

    @Output() public removed: EventEmitter<Tag> = new EventEmitter<Tag>();
    @Output() public changed: EventEmitter<TagChange> = new EventEmitter<
        TagChange
    >();

    public isOpen = false;

    public toggle(): void {
        this.isOpen = !this.isOpen;
    }

    public removeTag(): void {
        this.removed.emit(this.tag);
    }

    public and(): void {
        this.tagClass = 'must-contain';
        this.changed.emit(new TagChange(this.tag, TagStatus.And));
        this.toggle();
    }

    public or(): void {
        this.tagClass = 'can-contain';
        this.changed.emit(new TagChange(this.tag, TagStatus.Or));
        this.toggle();
    }

    public not(): void {
        this.tagClass = 'does-not-contain';
        this.changed.emit(new TagChange(this.tag, TagStatus.Not));
        this.toggle();
    }
}
