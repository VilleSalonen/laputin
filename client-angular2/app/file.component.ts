import {Component, Input, EventEmitter} from "angular2/core";
import {HTTP_PROVIDERS, Headers} from "angular2/http";

import {LaputinService} from "./laputinservice";
import {File} from "./file";
import {Tag} from "./tag";
import {TagAutocompleteComponent} from "./tagautocomplete.component";

@Component({
    selector: "file-row",
    template: `
        <a (click)="toggle()" [style.font-weight]="detailsOpen ? 'bold' : 'normal'">{{file.path}}</a>
        
        <p>
            <span *ngFor="#tag of file.tags">
                {{tag.name}}
            </span>
        </p>
        
        <div *ngIf="detailsOpen">
            <p><img src="http://localhost:3200/media/{{file.name}}" width="320" /></p>
            
            <p>
                <tag-autocomplete (select)="addTag($event)"></tag-autocomplete>
            </p>
            
            <p>
                <input type="text" [(ngModel)]="newTag" />
                <button (click)="addNewTag()">
                    <button>Add tag</button>
                </button>
            </p>
        </div>`,
    providers: [LaputinService, HTTP_PROVIDERS],
    directives: [TagAutocompleteComponent]
})
export class FileRowComponent {
    public newTag: string = "";
    
    @Input() file: File;
    public detailsOpen: boolean = false;
    
    constructor(private _service: LaputinService) {
    }
    
    public toggle(): void {
        this.detailsOpen = !this.detailsOpen;
    }
    
    public addNewTag(): void {
        this._service.createTag(this.file, this.newTag);
        this.newTag = "";
    }
    
    public addTag(tag: Tag): void {
        this._service.addTag(this.file, tag);
    }
    
    public onSelect(file: File): void {
        this._service.openFile(file);
    }
}