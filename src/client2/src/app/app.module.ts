import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import {
  routing,
  appRoutingProviders
} from './app.routing';

import { AppComponent } from './app.component';
import { FilesComponent } from './files/files.component';
import { TagsComponent } from './tags/tags.component';
import { DuplicatesComponent } from './duplicates/duplicates.component';

@NgModule({
  declarations: [
    AppComponent,
    FilesComponent,
    TagsComponent,
    DuplicatesComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    routing
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
