import {
    Component,
    OnInit,
    Input,
    Injectable,
    Inject,
    Query
} from '@angular/core';

import { LaputinService } from './../laputin.service';
import { Tag } from '../models/tag';
import { FileQueryService } from '../file-query.service';
import { FileQuery } from '../models';
import { Router } from '@angular/router';

@Component({
    selector: 'app-tag-row',
    styleUrls: ['./tag-row.component.scss'],
    templateUrl: './tag-row.component.html'
})
@Injectable()
export class TagRowComponent implements OnInit {
    @Input() tag: Tag;
    public isEditing = false;
    public name = '';
    public showMyElement: boolean;

    public image: string;

    constructor(
        private _service: LaputinService,
        private fileQueryService: FileQueryService,
        private router: Router
    ) {}

    ngOnInit() {
        this.image = `/laputin/tag-thumbs/${this.tag.id}.jpg`;
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
        this._service.renameTag(this.tag, this.name).toPromise();
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

    public goToTag(): void {
        const query = new FileQuery();
        query.andTag(this.tag);
        this.fileQueryService.emit(query);
        this.router.navigate(['/files']);
    }
}
