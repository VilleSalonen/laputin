import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VirtualScrollerModule } from '@iharbeck/ngx-virtual-scroller';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { LazyLoadImageModule } from 'ng-lazyload-image';

import { AppComponent } from './app.component';
import { DuplicatesComponent } from './duplicates/duplicates.component';
import { FileItemComponent } from './file-item/file-item.component';
import { FilesComponent } from './files/files.component';
import { TagsComponent } from './tags/tags.component';
import { TagFilterPipe } from './tag-filter.pipe';
import { TagRowComponent } from './tag-row/tag-row.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { LaputinService } from './laputin.service';
import { PlayerService } from './player.service';
import { TimecodeComponent } from './timecode/timecode.component';
import { TimecodesComponent } from './timecodes/timecodes.component';
import { TimecodeSearchComponent } from './timecode-search/timecode-search.component';
import { TagScreenshotDialogComponent } from './tag-screenshot-dialog/tag-screenshot-dialog.component';
import { TimecodeEditDialogComponent } from './timecode-edit-dialog/timecode-edit-dialog.component';
import { TagAutocompleteModule } from './tag-autocomplete/tag-autocomplete.module';
import { FileQueryModule } from './file-query-component/file-query.module';
import { TagQueryModule } from './tag-query-component/tag-query.module';
import { PipesModule } from './pipes/pipes.module';
import { FileComponent } from './file/file.component';
import { ImageFileComponent } from './image-file/image-file.component';
import { TimecodeMobileReadonlyComponent } from './timecode-mobile-readonly/timecode-mobile-readonly.component';
import { SceneComponent } from './scene/scene.component';
import { FileSelectorModule } from './file-selector-component/file-selector.module';
import { MigrateFileDataDialogComponent } from './migrate-file-data-dialog/migrate-file-data-dialog.component';
import { TimecodeItemComponent } from './timecode-item/timecode-item.component';
import { TimecodeQueryModule } from './timecode-query-component/timecode-query.module';
import { FileItemDetailsComponent } from './file-item-details/file-item-details.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

@NgModule({
    declarations: [
        AppComponent,
        DuplicatesComponent,
        FileItemComponent,
        FileItemDetailsComponent,
        TimecodeItemComponent,
        FilesComponent,
        TagFilterPipe,
        TagRowComponent,
        TagsComponent,
        TagScreenshotDialogComponent,
        TimecodeComponent,
        TimecodeEditDialogComponent,
        TimecodesComponent,
        TimecodeSearchComponent,
        VideoPlayerComponent,
        FileComponent,
        ImageFileComponent,
        TimecodeMobileReadonlyComponent,
        SceneComponent,
        MigrateFileDataDialogComponent,
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
        TagQueryModule,
        TimecodeQueryModule,
        PipesModule,
        MatExpansionModule,
        MatTabsModule,
        FileSelectorModule,
        RouterModule.forRoot(
            [
                { path: '', redirectTo: 'files', pathMatch: 'full' },
                { path: 'files', component: FilesComponent },
                { path: 'files/:hash', component: FileComponent },
                { path: 'timecodes', component: TimecodesComponent },
                { path: 'tags', component: TagsComponent },
                { path: 'duplicates', component: DuplicatesComponent },
            ],
            { relativeLinkResolution: 'legacy' }
        ),
        VirtualScrollerModule,
        BrowserAnimationsModule,
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        LaputinService,
        PlayerService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
