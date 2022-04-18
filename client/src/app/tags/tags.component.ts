import {
    Component,
    Injectable,
    ViewChild,
    ElementRef,
    AfterViewInit,
} from '@angular/core';

import { Tag } from './../models/tag';
import { LaputinService } from './../laputin.service';
import { Observable, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { shareReplay, map, tap, switchMap } from 'rxjs/operators';
import { TagQuery } from '../models/tagquery';

@Component({
    styleUrls: ['./tags.component.scss'],
    templateUrl: './tags.component.html',
})
@Injectable()
export class TagsComponent implements AfterViewInit {
    public tags: Tag[] = [];
    public filteredTags: Tag[] = [];
    public filteredOrphanedTags: Tag[] = [];
    public loading: boolean;

    public tags$: Observable<Tag[]>;
    public filteredTags$: Observable<Tag[]>;

    @ViewChild('tags')
    public tagsElement: ElementRef<HTMLDivElement>;

    public tagStyle: any;

    private tagQuery: Subject<TagQuery> = new BehaviorSubject<TagQuery>(
        new TagQuery()
    );

    constructor(private _service: LaputinService) {
        const query = this.getPreviousOrDefaultQuery();
        this.tagQuery.next(query);

        this.tags$ = this._service.getTags().pipe(shareReplay(1));
        this.filteredTags$ = this.tagQuery.pipe(
            switchMap((query) => this._service.getTags(query))
        );
    }

    public ngAfterViewInit(): void {
        const totalWidth = this.tagsElement.nativeElement.scrollWidth - 10;

        const aspectRatio = 16 / 9;

        let columns: number;
        if (totalWidth < 960) {
            columns = 1;
        } else if (totalWidth >= 960 && totalWidth < 1280) {
            columns = 2;
        } else if (totalWidth >= 1280 && totalWidth < 1920) {
            columns = 3;
        } else {
            columns = 4;
        }

        this.tagStyle = {
            width: Math.floor(totalWidth / columns) + 'px',
            height: Math.floor(totalWidth / columns / aspectRatio) + 'px',
        };
    }

    public tagQueryUpdated(tagQuery: TagQuery) {
        this.tagQuery.next(tagQuery);
    }

    private getPreviousOrDefaultQuery(): TagQuery {
        const fromLocalStorage = localStorage.getItem('tagQuery');
        if (!fromLocalStorage || fromLocalStorage === 'undefined') {
            return new TagQuery();
        }

        return new TagQuery(JSON.parse(fromLocalStorage));
    }
}
