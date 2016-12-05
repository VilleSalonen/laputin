import { Component, OnInit, Input, Injectable, Inject } from '@angular/core';

import {LaputinService} from "./../laputin.service";
import { Tag } from "../models/tag";

@Component({
    selector: 'tag-row',
    template: `
        <div>
            <div *ngIf="!isEditing" (click)="edit()">{{tag.name}}</div>
            <div *ngIf="isEditing">
                <input type="text" [(ngModel)]="name" (keyup)="onKeyUp($event)" />
                <button (click)="save()">Save</button>
                <button (click)="cancelEdit()">Cancel</button>
            </div>
        </div>`
})
@Injectable()
export class TagRowComponent implements OnInit {
    @Input() tag: Tag;
    public isEditing: boolean = false;
    public name: string = "";

    constructor(@Inject(LaputinService) private _service: LaputinService) {
    }

    ngOnInit() {
    }

    public onKeyUp($event: KeyboardEvent): void {
        const ENTER: number = 13;
        const ESC: number = 27;

        if ($event.which == ENTER) {
            this.save();
        }
        
        if ($event.which == ESC) {
            this.cancelEdit();
        }
    }

    public save(): void {
        this._service.renameTag(this.tag, this.name);
        this.tag.name = this.name;
        this.cancelEdit();
    }

    public edit(): void {
        this.name = this.tag.name;
        this.isEditing = true;
    }

    public cancelEdit(): void {
        this.isEditing = false;
        this.name = '';
    }
}
