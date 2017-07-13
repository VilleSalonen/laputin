import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import {
  LocationStrategy,
  HashLocationStrategy
} from '@angular/common';

import { AppComponent } from './app.component';
import { DuplicatesComponent } from './duplicates/duplicates.component';
import { FilesComponent } from './files/files.component';
import { FileRowComponent } from './file-row/file-row.component';
import { FileSearchComponent } from './file-search/file-search.component';
import { SearchBoxComponent } from './search-box/search-box.component';
import { SearchTagComponent } from './search-tag/search-tag.component';
import { TagAutocompleteComponent } from './tag-autocomplete/tag-autocomplete.component';
import { TagsComponent } from './tags/tags.component';
import { TagFilterPipe } from './tag-filter.pipe';
import { TagRowComponent } from './tag-row/tag-row.component';

@NgModule({
  declarations: [
    AppComponent,
    DuplicatesComponent,
    FilesComponent,
    FileRowComponent,
    FileSearchComponent,
    SearchBoxComponent,
    SearchTagComponent,
    TagAutocompleteComponent,
    TagFilterPipe,
    TagRowComponent,
    TagsComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot([
      { path: '', redirectTo: 'files', pathMatch: 'full' },
      { path: 'files', component: FilesComponent },
      { path: 'tags', component: TagsComponent },
      { path: 'duplicates', component: DuplicatesComponent }
    ])
  ],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
