import { NgModule } from '@angular/core';

import { FileSelectorComponent } from './file-selector.component';
import {
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatMenuModule
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LaputinService } from '../laputin.service';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatAutocompleteModule,
        MatInputModule,
        MatChipsModule,
        MatIconModule,
        BrowserModule,
        MatButtonModule,
        MatMenuModule,
        PipesModule
    ],
    exports: [FileSelectorComponent],
    declarations: [FileSelectorComponent],
    providers: [LaputinService]
})
export class FileSelectorModule {}
