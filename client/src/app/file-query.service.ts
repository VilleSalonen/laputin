import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FileQuery } from './models';

@Injectable({
    providedIn: 'root',
})
export class FileQueryService {
    public query$: Observable<FileQuery>;

    private query: BehaviorSubject<FileQuery> = new BehaviorSubject<FileQuery>(
        new FileQuery()
    );

    constructor() {
        this.query$ = this.query.asObservable();

        const storedQuery = this.getPreviousQuery();
        if (storedQuery) {
            this.emit(storedQuery);
        }
    }

    public emit(query: FileQuery): void {
        localStorage.setItem('fileQuery', JSON.stringify(query));
        this.query.next(query);
    }

    private getPreviousQuery(): FileQuery {
        const fromLocalStorage = localStorage.getItem('fileQuery');
        if (!fromLocalStorage || fromLocalStorage === 'undefined') {
            return undefined;
        }

        return new FileQuery(JSON.parse(fromLocalStorage));
    }
}
