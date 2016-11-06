import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { FilesComponent } from './files/files.component';
import { TagsComponent } from './tags/tags.component';
import { DuplicatesComponent } from './duplicates/duplicates.component';
import { FileSearchComponent } from './file-search/file-search.component';
import { SearchTagComponent } from './search-tag/search-tag.component';
import { TagAutocompleteComponent } from './tag-autocomplete/tag-autocomplete.component';

@NgModule({
  declarations: [
    AppComponent,
    FilesComponent,
    TagsComponent,
    DuplicatesComponent,
    FileSearchComponent,
    SearchTagComponent,
    TagAutocompleteComponent
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
      { path: 'duplicates', component: DuplicatesComponent },
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
