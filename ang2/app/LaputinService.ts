import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Rx';
import {Http, HTTP_PROVIDERS, Headers} from 'angular2/http';

import { File } from "./file";
import { Tag } from "./tag";

@Injectable()
export class LaputinService {
    public tags : Observable<Tag[]>;
    private _tagObserver: any;
    
    public files : Observable<File[]>;
    private _fileObserver: any;
    
    constructor(private _http: Http) {
        this.tags = new Observable<Tag[]>((observer: any) => this._tagObserver = observer).share();
        this.files = new Observable<File[]>((observer: any) => this._fileObserver = observer).share();
    }
    
    public loadTags() {
        this._http.get('http://localhost:12345/tags')
            .map(res => res.json())
            .subscribe(data => {
                var converted = Observable.fromArray(data).map((tag: any) => new Tag(tag.id, tag.name, tag.associationCount));
                this._tagObserver.next(converted);
            });
            
        this._http.get('http://localhost:12345/files')
            .map(res => res.json())
            .subscribe(data => {
                var converted = Observable.fromArray(data).map((file: any) => new File(file.hash, file.path, []));
                this._fileObserver.next(converted);
            });
    }
    
    public openFile(file: File) {
        let body = JSON.stringify({ selectedHashes: [file.hash] });
        const headers = new Headers({'Content-Type': 'application/json'});
        
        this._http.post("http://localhost:12345/open/files/", body, { headers: headers })
                   .subscribe(
                        data => console.log("Data: " + data),
                        err => console.log("Error: " + err),
                        () => console.log("Complete")
                   );
    }
}