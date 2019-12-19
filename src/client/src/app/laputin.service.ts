import { Injectable } from '@angular/core';
import { tap, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';

import {
    File,
    FileQuery,
    Timecode,
    Tag,
    TimecodeTag,
    Duplicate
} from './models';

@Injectable()
export class LaputinService {
    private _baseUrl = '/api';

    public thumbnailChanged: Subject<File> = new Subject<File>();

    constructor(private _http: HttpClient) {}

    public queryFiles(query: FileQuery): Observable<File[]> {
        const params = this.compileParams(query);
        return this._http.get(this._baseUrl + '/files' + params).pipe(
            map((files: any[]): File[] => {
                const result: File[] = [];
                if (files) {
                    files.forEach((file: any) =>
                        result.push(this._convertFile(file))
                    );
                }

                return result;
            })
        );
    }

    public queryTimecodes(query: FileQuery): Observable<Timecode[]> {
        const params = this.compileParams(query);
        return this._http.get<Timecode[]>(
            this._baseUrl + '/timecodes' + params
        );
    }

    public getTags(): Observable<Tag[]> {
        return this._http
            .get(this._baseUrl + '/tags')
            .pipe(
                map((tags: any[]): Tag[] =>
                    tags.map((tag: any) => this._convertTag(tag))
                )
            );
    }

    public getAllTags(): Observable<Tag[]> {
        return this._http
            .get(this._baseUrl + '/tags?unassociated=true')
            .pipe(
                map((tags: any[]): Tag[] =>
                    tags.map((tag: any) => this._convertTag(tag))
                )
            );
    }

    public getTimecodes(file: File): Observable<Timecode[]> {
        return this._http.get<Timecode[]>(
            this._baseUrl + '/files/' + file.hash + '/timecodes'
        );
    }

    public createTagTimecode(
        file: File,
        timecode: Timecode
    ): Observable<Timecode> {
        const body = JSON.stringify({ timecode: timecode });
        const headers = new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json'
        });

        return this._http.post<Timecode>(
            this._baseUrl + '/files/' + file.hash + '/timecodes',
            body,
            { headers: headers }
        );
    }

    public deleteTimecodeTag(
        timecode: Timecode,
        timecodeTag: TimecodeTag
    ): Observable<any> {
        return this._http.delete(
            this._baseUrl +
                '/files/' +
                timecode.hash +
                '/timecodes/' +
                timecode.timecodeId +
                '/tags/' +
                timecodeTag.timecodeTagId
        );
    }

    public getDuplicates(): Observable<Duplicate[]> {
        return this._http.get(this._baseUrl + '/duplicates').pipe(
            map((duplicates: any): any[] => {
                const result: Duplicate[] = [];

                const hashes = Object.keys(duplicates);

                for (const hash of hashes) {
                    const current = duplicates[hash];
                    const files = current.map(
                        (file: any) =>
                            new File(file.hash, file.path, [], file.size)
                    );
                    result.push(new Duplicate(hash, files));
                }
                return result;
            })
        );
    }

    private _convertTag(tag: any): Tag {
        return new Tag(tag.id, tag.name, tag.associationCount);
    }

    private _convertTags(tags: any): Tag[] {
        return tags.map((tag: any) => this._convertTag(tag));
    }

    private _convertFile(file: any): File {
        return new File(
            file.hash,
            file.path,
            this._convertTags(file.tags),
            file.size,
            file.metadata
        );
    }

    public screenshotFile(file: File, timeInSeconds: number): Observable<any> {
        const body = JSON.stringify({ hash: file.hash, time: timeInSeconds });
        const headers = new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json'
        });

        return this._http
            .post(this._baseUrl + '/screenshot', body, { headers: headers })
            .pipe(tap(() => this.thumbnailChanged.next(file)));
    }

    public screenshotTimecode(
        file: File,
        timecode: Timecode,
        timeInSeconds: number
    ): Observable<any> {
        const body = JSON.stringify({
            hash: file.hash,
            timecode: timecode,
            time: timeInSeconds
        });
        const headers = new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json'
        });

        return this._http.post(this._baseUrl + '/screenshotTimecode', body, {
            headers: headers
        });
    }

    public screenshotTag(
        tag: Tag,
        file: File,
        timeInSeconds: number
    ): Observable<any> {
        const body = JSON.stringify({
            tag: tag,
            hash: file.hash,
            time: timeInSeconds
        });
        const headers = new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json'
        });

        return this._http.post(this._baseUrl + '/screenshotTag', body, {
            headers: headers
        });
    }

    public openFiles(query: FileQuery): Observable<any> {
        const params = this.compileParams(query);
        return this._http.get(this._baseUrl + '/open/files' + params);
    }

    public createTag(newTagName: string): Observable<Tag> {
        const body = JSON.stringify({ tagName: newTagName });
        const headers = new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json'
        });

        return this._http
            .post(this._baseUrl + '/tags', body, { headers: headers })
            .pipe(map(tag => this._convertTag(tag)));
    }

    public renameTag(tag: Tag, newTagName: string): Observable<Tag> {
        const body = JSON.stringify({ name: newTagName });
        const headers = new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json'
        });

        return this._http
            .put(this._baseUrl + '/tags/' + tag.id, body, { headers: headers })
            .pipe(map(jsonTag => this._convertTag(jsonTag)));
    }

    public addTags(file: File, tags: Tag[]): Observable<any> {
        const body = JSON.stringify({
            selectedTags: tags
        });
        const headers = new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json'
        });

        return this._http.post(
            this._baseUrl + '/files/' + file.hash + '/tags',
            body,
            { headers: headers }
        );
    }

    public addTag(file: File, tag: Tag): Observable<any> {
        return this.addTags(file, [tag]);
    }

    public proxyExists(file: File): Observable<any> {
        return this._http.get(this._baseUrl + '/proxyExists/' + file.hash);
    }

    public deleteTagFileAssoc(file: File, tag: Tag): Observable<any> {
        return this._http.delete(
            this._baseUrl + '/files/' + file.hash + '/tags/' + tag.id
        );
    }

    public updateTimecodeStartAndEnd(
        file: File,
        timecode: Timecode
    ): Observable<any> {
        const body = JSON.stringify({
            timecode: timecode
        });
        const headers = new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json'
        });
        return this._http.put(
            this._baseUrl +
                '/files/' +
                file.hash +
                '/timecodes/' +
                timecode.timecodeId,
            body,
            { headers: headers }
        );
    }

    private compileParams(query: FileQuery): string {
        const params: string[] = [];

        if (query) {
            if (query.filename) {
                params.push('filename=' + query.filename);
            }
            if (query.status) {
                params.push('status=' + query.status);
            }
            if (query.hash) {
                params.push('hash=' + query.hash);
            }

            if (query.andTags.length > 0) {
                params.push(
                    'and=' + query.andTags.map((tag: Tag) => tag.id).join(',')
                );
            }
            if (query.orTags.length > 0) {
                params.push(
                    'or=' + query.orTags.map((tag: Tag) => tag.id).join(',')
                );
            }
            if (query.notTags.length > 0) {
                params.push(
                    'not=' + query.notTags.map((tag: Tag) => tag.id).join(',')
                );
            }
        }

        let paramsStr = '';
        if (params.length > 0) {
            paramsStr = '?' + params.join('&');
        }

        return paramsStr;
    }
}
