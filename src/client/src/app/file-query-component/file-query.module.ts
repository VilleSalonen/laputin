import { NgModule } from '@angular/core';

import { FileQueryComponent } from './file-query.component';
import {
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatAutocompleteModule,
    MatFormFieldModule
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
        PipesModule
    ],
    exports: [FileQueryComponent],
    declarations: [FileQueryComponent],
    providers: [LaputinService]
})
export class FileQueryModule {}