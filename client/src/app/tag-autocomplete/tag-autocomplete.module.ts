import { NgModule } from '@angular/core';
import {
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
} from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { TagAutocompleteComponent } from './tag-autocomplete.component';
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
        PipesModule
    ],
    exports: [TagAutocompleteComponent],
    declarations: [TagAutocompleteComponent],
    providers: []
})
export class TagAutocompleteModule {}
