import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import {
  LocationStrategy,
  HashLocationStrategy
} from '@angular/common';
import { VirtualScrollModule } from 'angular2-virtual-scroll';
import { MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatAutocompleteModule, MatSlideToggleModule, MatInputModule, MatBadgeModule, MatSelectModule, MatCardModule, MatSliderModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { DuplicatesComponent } from './duplicates/duplicates.component';
import { FileComponent } from './file/file.component';
import { FilesComponent } from './files/files.component';
import { FileSearchComponent } from './file-search/file-search.component';
import { SearchBoxComponent } from './search-box/search-box.component';
import { SearchTagComponent } from './search-tag/search-tag.component';
import { TagAutocompleteComponent } from './tag-autocomplete/tag-autocomplete.component';
import { TagsComponent } from './tags/tags.component';
import { TagFilterPipe } from './tag-filter.pipe';
import { TagRowComponent } from './tag-row/tag-row.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { LaputinService } from './laputin.service';
import { PlayerService } from './player.service';
import { TimecodeComponent } from './timecode/timecode.component';
import { TimecodesComponent } from './timecodes/timecodes.component';
import { TimecodeReadonlyComponent } from './timecode-readonly/timecode-readonly.component';
import { TimecodeSearchComponent } from './timecode-search/timecode-search.component';


@NgModule({
  declarations: [
    AppComponent,
    DuplicatesComponent,
    FileComponent,
    FilesComponent,
    FileSearchComponent,
    SearchBoxComponent,
    SearchTagComponent,
    TagAutocompleteComponent,
    TagFilterPipe,
    TagRowComponent,
    TagsComponent,
    TimecodeComponent,
    TimecodeReadonlyComponent,
    TimecodesComponent,
    TimecodeSearchComponent,
    VideoPlayerComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatAutocompleteModule, MatSlideToggleModule, MatInputModule, MatBadgeModule, MatSelectModule, MatCardModule, MatSliderModule,
    RouterModule.forRoot([
      { path: '', redirectTo: 'files', pathMatch: 'full' },
      { path: 'files', component: FilesComponent },
      { path: 'files/:hash', component: FilesComponent },
      { path: 'timecodes', component: TimecodesComponent },
      { path: 'tags', component: TagsComponent },
      { path: 'duplicates', component: DuplicatesComponent }
    ]),
    VirtualScrollModule,
    BrowserAnimationsModule
  ],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}, LaputinService, PlayerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
