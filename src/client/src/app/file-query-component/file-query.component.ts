import {
    Component,
    ElementRef,
    ViewChild,
    Input,
    Output,
    EventEmitter,
    OnInit,
    Injectable,
    HostListener
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
    MatAutocompleteSelectedEvent,
    MatAutocomplete,
    MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { distinctUntilChanged, tap } from 'rxjs/operators';

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
    File,
    SearchOption
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
    public allSearchOptions: Option[] = [
        new Option(OptionType.SearchOption, 'tag', 'tag:'),
        new Option(OptionType.SearchOption, 'tagged, untagged, all', 'status:'),
        new Option(OptionType.SearchOption, 'file', 'file:')
    ];

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

    private queryUpdatedSubject = new Subject<FileQuery>();

    constructor(private _service: LaputinService, private router: Router) {
        this.queryUpdatedSubject
            .pipe(
                distinctUntilChanged(
                    (a, b) => JSON.stringify(a) === JSON.stringify(b)
                )
            )
            .subscribe(query => {
                this.query = new FileQuery(query);
                this.queryUpdated.emit(query);
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
        const query = new FileQuery(this.query);
        query.removeTag(tag);
        this.emitUpdate(query);
    }

    public andTag(tag: Tag) {
        const query = new FileQuery(this.query);
        query.andTag(tag);
        this.emitUpdate(query);
    }

    public orTag(tag: Tag) {
        const query = new FileQuery(this.query);
        query.orTag(tag);
        this.emitUpdate(query);
    }

    public notTag(tag: Tag) {
        const query = new FileQuery(this.query);
        query.notTag(tag);
        this.emitUpdate(query);
    }

    public async onOptionSelected(event: MatAutocompleteSelectedEvent) {
        if (event && event.option && event.option.value) {
            if (event.option.value.type === OptionType.SearchOption) {
                this.termInput.nativeElement.value = event.option.value.value;
            } else if (event.option.value.type === OptionType.Status) {
                const query = new FileQuery(this.query);
                query.status = event.option.value.value;
                query.filename = '';
                this.emitUpdate(query);
                this.clearInput();
            } else if (event.option.value.type === OptionType.Tag) {
                const query = new FileQuery(this.query);
                query.andTag(event.option.value.value);
                query.filename = '';
                this.emitUpdate(query);
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
            // this.query = new FileQuery();
            // this.queryUpdated.emit(this.query);
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
    }

    public clearInputAndQuery(): void {
        this.clearInput();
        this.clearQuery();
    }

    public clearInput(): void {
        this.searchTerm = '';
        this.termInput.nativeElement.value = '';
        this.termCtrl.setValue(null);
        this.matchingTags = [];
    }

    public clearQuery(): void {
        this.emitUpdate(new FileQuery());
    }

    public clearStatus(): void {
        const query = new FileQuery(this.query);
        query.status = 'both';
        this.emitUpdate(query);
    }

    public onKeyUp($event: KeyboardEvent): void {
        if ($event.key === 'Esc') {
            this.clearInput();
        }

        if ($event.key === 'Enter') {
            this.autocompleteTrigger.closePanel();
            const query = new FileQuery(this.query);
            query.filename = this.searchTerm || '';
            this.emitUpdate(query);
        }
    }

    public emitUpdate(query: FileQuery) {
        this.queryUpdatedSubject.next(query);
    }

    public showHelp() {}

    @HostListener('document:keypress', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.code === 'KeyF' && event.ctrlKey && event.shiftKey) {
            this.termInput.nativeElement.focus();
        }
    }
}
