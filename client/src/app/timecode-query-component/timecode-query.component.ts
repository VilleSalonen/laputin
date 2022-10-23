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
import { UntypedFormControl } from '@angular/forms';
import {
    MatAutocompleteSelectedEvent,
    MatAutocomplete,
    MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { distinctUntilChanged } from 'rxjs/operators';

import { Tag } from './../models/tag';
import { LaputinService } from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';
import { FileQuery } from '../models';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { FileQuerySort } from '../models/filequerysort';
import { TimecodeQueryService } from '../timecode-query.service';

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
    selector: 'app-timecode-query',
    styleUrls: ['./timecode-query.component.scss'],
    templateUrl: './timecode-query.component.html',
    providers: [LaputinService]
})
@Injectable()
export class TimecodeQueryComponent implements OnInit {
    public allTags: Option[] = [];
    public matchingTags: Option[] = [];

    public selectable = false;
    public removable = true;
    public addOnBlur = false;
    public termCtrl = new UntypedFormControl();

    public searchTerm: string;

    @ViewChild('termInput') termInput: ElementRef<
        HTMLInputElement
    >;
    @ViewChild('auto') matAutocomplete: MatAutocomplete;
    @ViewChild('trigger')
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

    constructor(
        private _service: LaputinService,
        private router: Router,
        private timecodeQueryService: TimecodeQueryService
    ) {
        this.timecodeQueryService.query$.subscribe(
            query => (this.query = query)
        );

        this.queryUpdatedSubject
            .pipe(
                distinctUntilChanged(
                    (a, b) => JSON.stringify(a) === JSON.stringify(b)
                )
            )
            .subscribe(query => {
                this.query = new FileQuery(query);
                this.queryUpdated.emit(query);
                this.timecodeQueryService.emit(query);
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
            const query = new FileQuery(this.query);
            query.andTag(event.option.value.value);
            query.filename = '';
            this.emitUpdate(query);
            this.clearInput();
        }
    }

    public onValueChange(event: Event): void {
        const value = (<any>event.target).value;

        this.searchTerm = value ? value.toLowerCase() : '';

        if (this.searchTerm.length === 0) {
            return;
        }

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

    @HostListener('document:keypress', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.code === 'KeyF' && event.ctrlKey && event.shiftKey) {
            this.termInput.nativeElement.focus();
        }
    }

    public sortBy(sort: FileQuerySort): void {
        const query = new FileQuery(this.query);
        query.sort = sort;
        this.emitUpdate(query);
    }
}
