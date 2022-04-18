import {
    Component,
    ElementRef,
    ViewChild,
    Input,
    Output,
    EventEmitter,
    OnInit,
    Injectable,
    HostListener,
    Query,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
    MatAutocompleteSelectedEvent,
    MatAutocomplete,
    MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { distinctUntilChanged } from 'rxjs/operators';

import { Tag } from './../models/tag';
import { LaputinService } from './../laputin.service';
import { AutocompleteType } from '../models/autocompletetype';
import { FileQuery } from '../models';
import { Subject } from 'rxjs';
import { FileQueryService } from '../file-query.service';
import { TagQuerySort } from '../models/tagquerysort';
import { TagQuery } from '../models/tagquery';
import { Router } from '@angular/router';

enum OptionType {
    Tag,
    Status,
    File,
    SearchOption,
}

class Option {
    constructor(
        public type: OptionType,
        public text: string,
        public value: any
    ) {}
}

@Component({
    selector: 'app-tag-query',
    styleUrls: ['./tag-query.component.scss'],
    templateUrl: './tag-query.component.html',
    providers: [LaputinService],
})
@Injectable()
export class TagQueryComponent implements OnInit {
    public TagQuerySort = TagQuerySort;

    public allSearchOptions: Option[] = [
        new Option(OptionType.SearchOption, 'tag', 'tag:'),
        new Option(OptionType.SearchOption, 'tagged, untagged, all', 'status:'),
        new Option(OptionType.SearchOption, 'file', 'file:'),
    ];

    public allTags: Option[] = [];
    public matchingTags: Option[] = [];

    public selectable = false;
    public removable = true;
    public addOnBlur = false;
    public termCtrl = new FormControl();

    public searchTerm: string;

    @ViewChild('termInput') termInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto') matAutocomplete: MatAutocomplete;
    @ViewChild('trigger')
    autocompleteTrigger: MatAutocompleteTrigger;

    @Input() query: TagQuery;
    @Input() exclude: Tag[] = [];
    @Input() type: AutocompleteType;

    @Output()
    public queryUpdated = new EventEmitter<TagQuery>();

    public AutocompleteType = AutocompleteType;
    public OptionType = OptionType;

    private queryUpdatedSubject = new Subject<TagQuery>();

    constructor(
        private _service: LaputinService,
        private router: Router,
        private fileQueryService: FileQueryService
    ) {
        this.query = this.getPreviousOrDefaultQuery();

        this.queryUpdatedSubject
            .pipe(
                distinctUntilChanged(
                    (a, b) => JSON.stringify(a) === JSON.stringify(b)
                )
            )
            .subscribe((query) => {
                this.query = new TagQuery(query);
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
                        (t) => new Option(OptionType.Tag, t.name, t)
                    ))
            );

        setTimeout(
            () => (this.termInput.nativeElement.value = this.query.tagName)
        );
    }

    public remove(tag: Tag): void {
        const query = new TagQuery(this.query);
        query.removeTag(tag);
        this.emitUpdate(query);
    }

    public andTag(tag: Tag) {
        const query = new TagQuery(this.query);
        query.andTag(tag);
        this.emitUpdate(query);
    }

    public orTag(tag: Tag) {
        const query = new TagQuery(this.query);
        query.orTag(tag);
        this.emitUpdate(query);
    }

    public notTag(tag: Tag) {
        const query = new TagQuery(this.query);
        query.notTag(tag);
        this.emitUpdate(query);
    }

    public async onOptionSelected(event: MatAutocompleteSelectedEvent) {
        if (event && event.option && event.option.value) {
            if (event.option.value.type === OptionType.SearchOption) {
                this.termInput.nativeElement.value = event.option.value.value;
            } else if (event.option.value.type === OptionType.Tag) {
                const query = new TagQuery(this.query);
                query.andTag(event.option.value.value);
                query.tagName = '';
                this.emitUpdate(query);
                this.clearInput();
            }
        }
    }

    public async onValueChange(event: Event): Promise<void> {
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
        setTimeout(() => this.autocompleteTrigger.closePanel());
    }

    public clearQuery(): void {
        this.emitUpdate(new TagQuery());
    }

    public clearStatus(): void {
        const query = new TagQuery(this.query);
        this.emitUpdate(query);
    }

    public onKeyUp($event: KeyboardEvent): void {
        if ($event.key === 'Esc') {
            this.clearInput();
        }

        if ($event.key === 'Enter') {
            this.autocompleteTrigger.closePanel();
            const query = new TagQuery(this.query);
            query.tagName = this.searchTerm || '';
            this.emitUpdate(query);
        }
    }

    public emitUpdate(query: TagQuery) {
        this.queryUpdatedSubject.next(query);
        localStorage.setItem('tagQuery', JSON.stringify(query));
    }

    @HostListener('document:keypress', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.code === 'KeyF' && event.ctrlKey && event.shiftKey) {
            this.termInput.nativeElement.focus();
        }
    }

    public sortBy(sort: TagQuerySort): void {
        const query = new TagQuery(this.query);
        query.sort = sort;
        this.emitUpdate(query);
    }

    private getPreviousOrDefaultQuery(): TagQuery {
        const fromLocalStorage = localStorage.getItem('tagQuery');
        if (!fromLocalStorage || fromLocalStorage === 'undefined') {
            return new TagQuery();
        }

        return new TagQuery(JSON.parse(fromLocalStorage));
    }

    public openMatchingFiles() {
        const fileQuery = new FileQuery({ andTags: this.query.andTags });
        this.fileQueryService.emit(fileQuery);
        this.router.navigate(['/files']);
    }
}
