import {Component, Output, EventEmitter} from "angular2/core";

@Component({
    selector: "search-box",
    template: `
    <div>
        <input
            class="form-control"
            type="text"
            [(ngModel)]="term"
            (keyup)="onKeyUp($event)" />
    </div>`
})
export class SearchBox {
    public term: string = "";
    @Output()
    public update = new EventEmitter<string>();
    
    onKeyUp($event: KeyboardEvent): void {
        const ENTER: number = 13;
        const ESC: number = 27;
        
        if ($event.which == ENTER) {
            this.update.emit(this.term);
        }
        
        if ($event.which == ESC) {
            this.term = "";
        }
    }
}