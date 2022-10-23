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
import { UntypedFormControl } from '@angular/forms';
import {
    MatAutocompleteSelectedEvent,
    MatAutocomplete,
    MatAutocompleteTrigger
} from '@angular/material/autocomplete';

import { File } from './../models/file';
import { LaputinService } from './../laputin.service';
import { FileQuery } from '../models';

@Component({
    selector: 'app-file-selector',
    styleUrls: ['./file-selector.component.scss'],
    templateUrl: './file-selector.component.html',
    providers: [LaputinService]
})
@Injectable()
export class FileSelectorComponent implements OnInit {
    public allFiles: File[] = [];
    public matchingFiles: File[] = [];

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

    @Input() exclude: File;

    @Output()
    public fileSelected = new EventEmitter<File>();

    constructor(private _service: LaputinService) {}

    public ngOnInit() {
        this._service
            .queryFiles(new FileQuery())
            .toPromise()
            .then(
                (files: File[]) =>
                    (this.allFiles = files.filter(
                        f => f.hash !== this.exclude.hash
                    ))
            );
    }

    public async onOptionSelected(event: MatAutocompleteSelectedEvent) {
        if (event && event.option && event.option.value) {
            console.log(event.option.value);
            this.fileSelected.emit(event.option.value);
            this.clearInput();
        }
    }

    public onValueChange(event: Event): void {
        const value = (<any>event.target).value;

        this.searchTerm = value ? value.toLowerCase() : '';

        if (this.searchTerm.length === 0) {
            return;
        }

        this.matchingFiles = this.allFiles
            .filter((file: File) =>
                file.name.toLowerCase().includes(this.searchTerm)
            )
            .slice(0, 5);
    }

    public clearInput(): void {
        this.searchTerm = '';
        this.termInput.nativeElement.value = '';
        this.termCtrl.setValue(null);
    }

    public onKeyUp($event: KeyboardEvent): void {
        if ($event.key === 'Esc') {
            this.clearInput();
        }
    }
}
