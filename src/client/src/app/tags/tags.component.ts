import {
    Component,
    Injectable,
    ViewChild,
    ElementRef,
    AfterViewInit
} from '@angular/core';

import { Tag } from './../models/tag';
import { LaputinService } from './../laputin.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';

@Component({
    styleUrls: ['./tags.component.scss'],
    templateUrl: './tags.component.html'
})
@Injectable()
export class TagsComponent implements AfterViewInit {
    public tags: Tag[] = [];
    public filteredTags: Tag[] = [];
    public filteredOrphanedTags: Tag[] = [];
    public loading: boolean;

    public term = '';

    public tags$: Observable<Tag[]>;
    public filteredTags$: Observable<Tag[]>;

    @ViewChild('tags')
    public tagsElement: ElementRef<HTMLDivElement>;

    public tagStyle: any;

    private searchTerm = new BehaviorSubject<string>('');

    constructor(private _service: LaputinService) {
        this.tags$ = this._service.getTags().pipe(shareReplay(1));

        this.filteredTags$ = combineLatest(
            this.tags$,
            this.searchTerm.asObservable()
        ).pipe(
            map(([tags, searchTerm]: [Tag[], string]) =>
                tags.filter(
                    tag => tag.name.toUpperCase().indexOf(searchTerm) >= 0
                )
            )
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
            height: Math.floor(totalWidth / columns / aspectRatio) + 'px'
        };
    }

    public onKeyUp($event: KeyboardEvent): void {
        const ENTER = 13;
        const ESC = 27;

        if ($event.which === ENTER) {
            this.searchTerm.next(this.term.toUpperCase());
        }

        if ($event.which === ESC) {
            this.term = '';
            this.searchTerm.next(this.term);
        }
    }
}
