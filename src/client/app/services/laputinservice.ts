import {Promise} from "es6-promise";
import {Component, Injectable, Inject} from "angular2/core";
import {Observable} from "rxjs/Rx";
import "rxjs/add/operator/map";
import "rxjs/add/operator/toPromise";
import {Http, HTTP_PROVIDERS, Headers, Response} from "angular2/http";
import * as _ from "lodash";

import {File} from "./../models/file";
import {Tag} from "./../models/tag";
import {FileQuery} from "./../models/filequery";
import {Duplicate} from "./../models/duplicate";

@Component({
    providers: [HTTP_PROVIDERS]
})
@Injectable()
export class LaputinService {
    private _baseUrl: string = "/api"; 
    
    constructor(@Inject(Http) private _http: Http) {
    }

    public queryFiles(query: FileQuery): Promise<File[]> {
        var params = this.compileParams(query);
        return this._http.get(this._baseUrl + "/files" + params)
            .map(res => res.json())
            .map((files: any[]): File[] => {
                let result: File[] = [];
                if (files) {
                    files.forEach((file: any) => {
                        result.push(this._convertFile(file));
                    });
                }

                return result;
            }).toPromise();
    }

    public getTags(): Promise<Tag[]> {
        return this._http.get(this._baseUrl + "/tags")
            .map(res => res.json())
            .map((tags: any[]): Tag[] => {
                let result: Tag[] = [];
                if (tags) {
                    tags.forEach((tag: any) => {
                        result.push(this._convertTag(tag))
                    });
                }
                return result;
            }).toPromise();
    }

    public getDuplicates(): Promise<Duplicate[]> {
        return this._http.get(this._baseUrl + "/duplicates")
            .map(res => res.json())
            .map((duplicates: any): any[] => {
                let result: Duplicate[] = [];
                
                var hashes = Object.keys(duplicates);
                
                for (let hash of hashes) {
                    var current = duplicates[hash];
                    let files = current.map((file: any) => new File(file.hash, file.path, file.name, []));
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
        return new File(file.hash, file.path, file.name, this._convertTags(file.tags));
    }

    public openFiles(query: FileQuery): Promise<Response> {
        const headers = new Headers({ 'Accept': 'application/json', "Content-Type": "application/json" });
        var params = this.compileParams(query);
        return this._http.get(this._baseUrl + "/open/files" + params).toPromise();
    }

    public createTag(file: File, newTagName: string): Observable<Tag> {
        let body = JSON.stringify({ tagName: newTagName });
        const headers = new Headers({ 'Accept': 'application/json', "Content-Type": "application/json" });

        return this._http
            .post(this._baseUrl + "/tags", body, { headers: headers })
            .map(res => res.json())
            .map(tag => this._convertTag(tag));
    }

    public addTags(file: File, tags: Tag[]): Observable<Response> {
        let body = JSON.stringify({
            selectedTags: tags
        });
        const headers = new Headers({ 'Accept': 'application/json', "Content-Type": "application/json" });

        return this._http.post(this._baseUrl + "/files/" + file.hash + "/tags", body, { headers: headers });
    }

    public addTag(file: File, tag: Tag): Observable<Response> {
        return this.addTags(file, [tag]);
    }

    public deleteTagFileAssoc(file: File, tag: Tag): Observable<Response> {
        return this._http.delete(this._baseUrl + "/files/" + file.hash + "/tags/" + tag.id);
    }

    private compileParams(query: FileQuery): string {
        var params: string[] = [];

        if (query.filename) params.push("filename=" + query.filename);
        if (query.status) params.push("status=" + query.status);
        if (query.hash) params.push("hash=" + query.hash);

        if (query.andTags.length > 0) {
            params.push("and=" + _.map(query.andTags, (tag: Tag) => tag.id).join(","));
        }
        if (query.orTags.length > 0) {
            params.push("or=" + _.map(query.orTags, (tag: Tag) => tag.id).join(","));
        }
        if (query.notTags.length > 0) {
            params.push("not=" + _.map(query.notTags, (tag: Tag) => tag.id).join(","));
        }

        var paramsStr: string = "";
        if (params.length > 0)
            paramsStr = "?" + params.join("&");

        return paramsStr;
    }
}