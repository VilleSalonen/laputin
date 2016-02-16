import {Component, Input, EventEmitter} from "angular2/core";
import {HTTP_PROVIDERS, Headers} from "angular2/http";

import {LaputinService} from "./laputinservice";
import {File} from "./file";

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
            <button (click)="onSelect(file)">
                <button>Open</button>
            </button>
        </div>`,
    providers: [LaputinService, HTTP_PROVIDERS],
})
export class FileRowComponent {
    @Input() file: File;
    public detailsOpen: boolean = false;
    
    constructor(private _service: LaputinService) {
    }
    
    public toggle(): void {
        this.detailsOpen = !this.detailsOpen;
    }
    
    public onSelect(file: File): void {
        this._service.openFile(file);
    }
}