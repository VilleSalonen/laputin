import { NgModule }      from '@angular/core';
import { HttpModule } from "@angular/http";
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';

import { routing,
         appRoutingProviders } from './app.routing';
import {
  LocationStrategy,
  HashLocationStrategy
} from '@angular/common';

import { AppComponent }  from './app.component';
import {FilesComponent} from "./files.component";
import {TagsComponent} from "./tags.component";
import {DuplicatesComponent} from "./duplicates.component";
import {FileRowComponent} from "./file.component";
import {TagAutocompleteComponent} from "./tagautocomplete.component";
import {SearchBox} from "./searchbox.component";
import {FileSearchComponent} from "./filesearch.component";
import {SearchTag, TagChange} from "./searchtag.component";
import {TagsPipe} from "./tagspipe";

@NgModule({
  imports: [
      BrowserModule,
      HttpModule,
      FormsModule,
      ReactiveFormsModule,
      routing ],
  declarations: [
      AppComponent,
      FilesComponent,
      TagsComponent,
      DuplicatesComponent,
      FileRowComponent,
      TagAutocompleteComponent,
      SearchBox,
      FileSearchComponent,
      SearchTag,
      TagsPipe
  ],
  providers: [ {provide: LocationStrategy, useClass: HashLocationStrategy} ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }