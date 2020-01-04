import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import {
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatInputModule,
    MatBadgeModule,
    MatSliderModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTabsModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { LazyLoadImageModule } from 'ng-lazyload-image';

import { AppComponent } from './app.component';
import { DuplicatesComponent } from './duplicates/duplicates.component';
import { FileItemComponent } from './file-item/file-item.component';
import { FilesComponent } from './files/files.component';
import { SearchTagComponent } from './search-tag/search-tag.component';
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
import { TagScreenshotDialogComponent } from './tag-screenshot-dialog/tag-screenshot-dialog.component';
import { TimecodeEditDialogComponent } from './timecode-edit-dialog/timecode-edit-dialog.component';
import { TagAutocompleteModule } from './tag-autocomplete/tag-autocomplete.module';
import { FileQueryModule } from './file-query-component/file-query.module';
import { PipesModule } from './pipes/pipes.module';
import { FileComponent } from './file/file.component';
import { ImageFileComponent } from './image-file/image-file.component';
import { TimecodeMobileReadonlyComponent } from './timecode-mobile-readonly/timecode-mobile-readonly.component';

@NgModule({
    declarations: [
        AppComponent,
        DuplicatesComponent,
        FileItemComponent,
        FilesComponent,
        SearchTagComponent,
        TagFilterPipe,
        TagRowComponent,
        TagsComponent,
        TagScreenshotDialogComponent,
        TimecodeComponent,
        TimecodeEditDialogComponent,
        TimecodeReadonlyComponent,
        TimecodesComponent,
        TimecodeSearchComponent,
        VideoPlayerComponent,
        FileComponent,
        ImageFileComponent,
        TimecodeMobileReadonlyComponent
    ],
    entryComponents: [
        TagScreenshotDialogComponent,
        TimecodeEditDialogComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatAutocompleteModule,
        MatSlideToggleModule,
        MatInputModule,
        MatBadgeModule,
        MatSliderModule,
        MatDialogModule,
        MatMenuModule,
        MatTooltipModule,
        MatChipsModule,
        MatIconModule,
        LazyLoadImageModule,
        MatProgressSpinnerModule,
        TagAutocompleteModule,
        FileQueryModule,
        PipesModule,
        MatExpansionModule,
        MatTabsModule,
        RouterModule.forRoot([
            { path: '', redirectTo: 'files', pathMatch: 'full' },
            { path: 'files', component: FilesComponent },
            { path: 'files/:hash', component: FileComponent },
            { path: 'timecodes', component: TimecodesComponent },
            { path: 'tags', component: TagsComponent },
            { path: 'duplicates', component: DuplicatesComponent }
        ]),
        VirtualScrollerModule,
        BrowserAnimationsModule
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        LaputinService,
        PlayerService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
