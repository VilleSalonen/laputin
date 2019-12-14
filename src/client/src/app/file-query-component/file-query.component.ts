import {
    Component,
    ElementRef,
    ViewChild,
    Input,
    Output,
    EventEmitter,
    OnInit,
    Injectable
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
    MatAutocompleteSelectedEvent,
    MatAutocomplete,
    MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Tag } from './../models/tag';
import { File } from './../models/file';
import { LaputinService } from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';
import { FileQuery } from '../models';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

enum OptionType {
    Tag,
    Status,
    File
}

class Option {
    constructor(
        public type: OptionType,
        public text: string,
        public value: any
    ) {}
}

@Component({
    selector: 'app-file-query',
    styleUrls: ['./file-query.component.scss'],
    templateUrl: './file-query.component.html',
    providers: [LaputinService]
})
@Injectable()
export class FileQueryComponent implements OnInit {
    public allStatuses: Option[] = [
        new Option(OptionType.Status, 'Both', 'both'),
        new Option(OptionType.Status, 'Tagged', 'tagged'),
        new Option(OptionType.Status, 'Untagged', 'untagged')
    ];
    public matchingStatuses: Option[] = [];

    public allTags: Option[] = [];
    public matchingTags: Option[] = [];

    public allFiles: Option[] = [];
    public matchingFiles: Option[] = [];

    public selectable = false;
    public removable = true;
    public addOnBlur = false;
    public termCtrl = new FormControl();

    public searchTerm: string;

    @ViewChild('termInput', { static: false }) termInput: ElementRef<
        HTMLInputElement
    >;
    @ViewChild('auto', { static: false }) matAutocomplete: MatAutocomplete;
    @ViewChild('trigger', { static: false })
    autocompleteTrigger: MatAutocompleteTrigger;

    @Input() query: FileQuery;
    @Input() exclude: Tag[] = [];
    @Input() type: AutocompleteType;

    @Output()
    public queryUpdated = new EventEmitter<FileQuery>();

    public AutocompleteType = AutocompleteType;
    public OptionType = OptionType;

    public tagCreationAllowed = false;

    private filenameChanged: Subject<string> = new Subject<string>();

    constructor(private _service: LaputinService, private router: Router) {
        this.filenameChanged
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(model => {
                this.query.filename = model;
                this.emitUpdate(this.query);
            });
    }

    public ngOnInit() {
        this._service
            .getTags()
            .toPromise()
            .then(
                (tags: Tag[]) =>
                    (this.allTags = tags.map(
                        t => new Option(OptionType.Tag, t.name, t)
                    ))
            );

        this._service
            .queryFiles(new FileQuery())
            .toPromise()
            .then(
                (files: File[]) =>
                    (this.allFiles = files.map(
                        f => new Option(OptionType.File, f.name, f)
                    ))
            );

        setTimeout(
            () => (this.termInput.nativeElement.value = this.query.filename)
        );

        this.tagCreationAllowed = this.type !== AutocompleteType.FileSearch;
    }

    public remove(tag: Tag): void {
        this.query.removeTag(tag);
        this.emitUpdate(this.query);
    }

    public andTag(tag: Tag) {
        this.query.andTag(tag);
        this.emitUpdate(this.query);
    }

    public orTag(tag: Tag) {
        this.query.orTag(tag);
        this.emitUpdate(this.query);
    }

    public notTag(tag: Tag) {
        this.query.notTag(tag);
        this.emitUpdate(this.query);
    }

    public async onOptionSelected(event: MatAutocompleteSelectedEvent) {
        if (event && event.option && event.option.value) {
            if (event.option.value === 'use-tag') {
                this.termInput.nativeElement.value = 'tag:';
            } else if (event.option.value.type === OptionType.Status) {
                this.query.status = event.option.value.value;
                this.query.filename = '';
                this.emitUpdate(this.query);
                this.clearInput();
            } else if (event.option.value.type === OptionType.Tag) {
                this.andTag(event.option.value.value);
                this.query.filename = '';
                this.emitUpdate(this.query);
                this.clearInput();
            } else if (event.option.value.type === OptionType.File) {
                this.router.navigate(['/files', event.option.value.value.hash]);
            }
        }
    }

    public onValueChange(event: Event): void {
        const value = (<any>event.target).value;

        this.searchTerm = value ? value.toLowerCase() : '';

        if (this.searchTerm.length === 0) {
            this.query = new FileQuery();
            this.queryUpdated.emit(this.query);
            return;
        }

        this.matchingStatuses = this.allStatuses.filter(s =>
            s.text.toLowerCase().startsWith(this.searchTerm)
        );

        this.matchingFiles = this.allFiles
            .filter((option: Option) =>
                option.value.name.toLowerCase().includes(this.searchTerm)
            )
            .slice(0, 5);

        const tagSearchTerm = this.searchTerm.replace('tag:', '');
        const alreadyAdded = this.query.tags.map((tag: Tag) => tag.id);
        this.matchingTags = this.allTags
            .filter(
                (option: Option) => alreadyAdded.indexOf(option.value.id) === -1
            )
            .filter((option: Option) =>
                option.value.name.toLowerCase().includes(tagSearchTerm)
            )
            .slice(0, 5);

        this.filenameChanged.next(this.searchTerm);
    }

    public clearInputAndQuery(): void {
        this.clearInput();
        this.clearQuery();
    }

    public clearInput(): void {
        this.termInput.nativeElement.value = '';
        this.termCtrl.setValue(null);
        this.matchingTags = [];
    }

    public clearQuery(): void {
        this.query = new FileQuery();
        this.queryUpdated.emit(this.query);
    }

    public clearStatus(): void {
        this.query.status = 'both';
        this.emitUpdate(this.query);
    }

    public onKeyUp($event: KeyboardEvent): void {
        if ($event.key === 'Esc') {
            this.clearInput();
        }

        if ($event.key === 'Enter') {
            this.autocompleteTrigger.closePanel();
        }
    }

    public emitUpdate(query: FileQuery) {
        console.log(query);
        this.queryUpdated.emit(query);
    }

    public showHelp() {}
}
