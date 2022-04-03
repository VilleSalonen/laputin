import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { File } from './../models/file';
import { AutocompleteType } from '../models/autocompletetype';
import { LaputinService } from '../laputin.service';

export interface MigrateFileDataDialogData {
    file: File;
}

@Component({
    selector: 'app-migrate-file-data-dialog',
    templateUrl: 'migrate-file-data-dialog.component.html'
})
export class MigrateFileDataDialogComponent {
    public AutocompleteType = AutocompleteType;

    public selectedFile: File;
    public migrating = false;

    constructor(
        public dialogRef: MatDialogRef<MigrateFileDataDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: MigrateFileDataDialogData,
        private laputinService: LaputinService
    ) {}

    fileSelected(file: File): void {
        this.selectedFile = file;
    }

    migrate(): void {
        this.migrating = true;
        this.laputinService
            .migrateAllData(this.data.file, this.selectedFile)
            .toPromise()
            .then(() => this.dialogRef.close());
    }

    cancel(): void {
        this.dialogRef.close();
    }
}
