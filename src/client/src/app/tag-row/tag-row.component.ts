import { Component, OnInit, Input, Injectable, Inject } from '@angular/core';

import {LaputinService} from './../laputin.service';
import { Tag } from '../models/tag';

@Component({
    selector: 'app-tag-row',
    styleUrls: ['./tag-row.component.scss'],
    templateUrl: './tag-row.component.html',
})
@Injectable()
export class TagRowComponent implements OnInit {
    @Input() tag: Tag;
    public isEditing = false;
    public name = '';
    public showMyElement: boolean;

    constructor(@Inject(LaputinService) private _service: LaputinService) {
    }

    ngOnInit() {
    }

    public onKeyUp($event: KeyboardEvent): void {
        const ENTER = 13;
        const ESC = 27;

        if ($event.which === ENTER) {
            this.save();
        }

        if ($event.which === ESC) {
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
