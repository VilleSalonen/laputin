import {Component, Input, EventEmitter} from "angular2/core";

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
        </div>`
})
export class FileRowComponent {
    @Input() file: File;
    public detailsOpen: boolean = false;
    
    public toggle(): void {
        this.detailsOpen = !this.detailsOpen;
    }
}