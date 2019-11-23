import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import {Http, Headers, Response} from '@angular/http';
import * as _ from 'lodash';

import { File, FileQuery, Timecode, Tag, TimecodeTag, Duplicate } from './models';
import { tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class LaputinService {
    private _baseUrl = '/api';

    public thumbnailChanged: Subject<File> = new Subject<File>();

    constructor(private _http: HttpClient) {
    }

    public queryFiles(query: FileQuery): Promise<File[]> {
        const params = this.compileParams(query);
        return this._http.get(this._baseUrl + '/files' + params)
            .map((files: any[]): File[] => {
                const result: File[] = [];
                if (files) {
                    files.forEach((file: any) => result.push(this._convertFile(file)));
                }

                return result;
            }).toPromise();
    }

    public queryTimecodes(query: FileQuery): Promise<Timecode[]> {
        const params = this.compileParams(query);
        return <Promise<Timecode[]>>this._http.get(this._baseUrl + '/timecodes' + params)
            .toPromise();
    }

    public getTags(): Promise<Tag[]> {
        return this._http.get(this._baseUrl + '/tags')
            .map((tags: any[]): Tag[] => {
                const result: Tag[] = [];
                if (tags) {
                    tags.forEach((tag: any) => result.push(this._convertTag(tag)));
                }
                return result;
            }).toPromise();
    }

    public getAllTags(): Promise<Tag[]> {
        return this._http.get(this._baseUrl + '/tags?unassociated=true')
            .map((tags: any[]): Tag[] => {
                const result: Tag[] = [];
                if (tags) {
                    tags.forEach((tag: any) => result.push(this._convertTag(tag)));
                }
                return result;
            }).toPromise();
    }

    public getTimecodes(file: File): Promise<Timecode[]> {
        return <Promise<Timecode[]>>this._http.get(this._baseUrl + '/files/' + file.hash + '/timecodes')
            .toPromise();
    }

    public createTagTimecode(file: File, timecode: Timecode): Promise<Timecode> {
        const body = JSON.stringify({ timecode: timecode });
        const headers = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });

        return <Promise<Timecode>>this._http
            .post(this._baseUrl + '/files/' + file.hash + '/timecodes', body, { headers: headers })
            .toPromise();
    }

    public async deleteTimecodeTag(timecode: Timecode, timecodeTag: TimecodeTag): Promise<any> {
        return await this._http.delete(
            this._baseUrl + '/files/' + timecode.hash + '/timecodes/' + timecode.timecodeId + '/tags/' + timecodeTag.timecodeTagId)
            .toPromise();
    }

    public getDuplicates(): Promise<Duplicate[]> {
        return this._http.get(this._baseUrl + '/duplicates')
            .map((duplicates: any): any[] => {
                const result: Duplicate[] = [];

                const hashes = Object.keys(duplicates);

                for (const hash of hashes) {
                    const current = duplicates[hash];
                    const files = current.map((file: any) => new File(file.hash, file.path, [], file.size));
                    result.push(new Duplicate(hash, files));
                }
                return result;
            }).toPromise();
    }

    private _convertTag(tag: any): Tag {
        return new Tag(tag.id, tag.name, tag.associationCount);
    }

    private _convertTags(tags: any): Tag[] {
        return tags.map((tag: any) => this._convertTag(tag));
    }

    private _convertFile(file: any): File {
        return new File(file.hash, file.path, this._convertTags(file.tags), file.size);
    }

    public screenshotFile(file: File, timeInSeconds: number): Observable<any> {
        const body = JSON.stringify({ hash: file.hash, time: timeInSeconds });
        const headers = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });

        return this._http
            .post(this._baseUrl + '/screenshot', body, { headers: headers })
            .pipe(
                tap(() => this.thumbnailChanged.next(file))
            );
    }

    public screenshotTimecode(file: File, timecode: Timecode, timeInSeconds: number): Promise<any> {
        const body = JSON.stringify({ hash: file.hash, timecode: timecode, time: timeInSeconds });
        const headers = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });

        return this._http
            .post(this._baseUrl + '/screenshotTimecode', body, { headers: headers })
            .toPromise();
    }

    public screenshotTag(tag: Tag, file: File, timeInSeconds: number): Promise<any> {
        const body = JSON.stringify({ tag: tag, hash: file.hash, time: timeInSeconds });
        const headers = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });

        return this._http
            .post(this._baseUrl + '/screenshotTag', body, { headers: headers })
            .toPromise();
    }

    public openFiles(query: FileQuery): Promise<any> {
        const params = this.compileParams(query);
        return this._http.get(this._baseUrl + '/open/files' + params).toPromise();
    }

    public createTag(newTagName: string): Observable<Tag> {
        const body = JSON.stringify({ tagName: newTagName });
        const headers = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });

        return this._http
            .post(this._baseUrl + '/tags', body, { headers: headers })
            .map(tag => this._convertTag(tag));
    }

    public renameTag(tag: Tag, newTagName: string): Promise<Tag> {
        const body = JSON.stringify({ name: newTagName });
        const headers = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });

        return this._http
            .put(this._baseUrl + '/tags/' + tag.id, body, { headers: headers })
            .map(jsonTag => this._convertTag(jsonTag))
            .toPromise();
    }

    public addTags(file: File, tags: Tag[]): Observable<any> {
        const body = JSON.stringify({
            selectedTags: tags
        });
        const headers = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });

        return this._http.post(this._baseUrl + '/files/' + file.hash + '/tags', body, { headers: headers });
    }

    public addTag(file: File, tag: Tag): Observable<Response> {
        return this.addTags(file, [tag]);
    }

    public proxyExists(file: File): Observable<any> {
        return this._http
            .get(this._baseUrl + '/proxyExists/' + file.hash);
    }

    public deleteTagFileAssoc(file: File, tag: Tag): Observable<any> {
        return this._http.delete(this._baseUrl + '/files/' + file.hash + '/tags/' + tag.id);
    }

    public updateTimecodeStartAndEnd(file: File, timecode: Timecode): Promise<any> {
        const body = JSON.stringify({
            timecode: timecode
        });
        const headers = new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' });
        return this._http.put(this._baseUrl + '/files/' + file.hash + '/timecodes/' + timecode.timecodeId, body, { headers: headers }).toPromise();
    }

    private compileParams(query: FileQuery): string {
        const params: string[] = [];

        if (query) {
            if (query.filename) { params.push('filename=' + query.filename); }
            if (query.status) { params.push('status=' + query.status); }
            if (query.hash) { params.push('hash=' + query.hash); }

            if (query.andTags.length > 0) {
                params.push('and=' + _.map(query.andTags, (tag: Tag) => tag.id).join(','));
            }
            if (query.orTags.length > 0) {
                params.push('or=' + _.map(query.orTags, (tag: Tag) => tag.id).join(','));
            }
            if (query.notTags.length > 0) {
                params.push('not=' + _.map(query.notTags, (tag: Tag) => tag.id).join(','));
            }
        }

        let paramsStr = '';
        if (params.length > 0) {
            paramsStr = '?' + params.join('&');
        }

        return paramsStr;
    }
}
