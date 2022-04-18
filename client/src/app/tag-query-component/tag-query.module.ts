import { NgModule } from '@angular/core';

import { TagQueryComponent } from './tag-query.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LaputinService } from '../laputin.service';
import { PipesModule } from '../pipes/pipes.module';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
        MatCheckboxModule,
        BrowserModule,
        MatButtonModule,
        MatMenuModule,
        PipesModule,
    ],
    exports: [TagQueryComponent],
    declarations: [TagQueryComponent],
    providers: [LaputinService],
})
export class TagQueryModule {}
