import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
    selector: 'app-search-box',
    template: `
    <mat-form-field>
        <input
            matInput
            type="text"
            [(ngModel)]="term"
            (keyup)="onKeyUp($event)"
            placeholder="Create a new tag" />
    </mat-form-field>`
})
export class SearchBoxComponent {
    public term = '';

    // Fake boolean because true values are passed to input properties as 1.
    @Input()
    public clearOnEnter = 0;

    @Output()
    public update: EventEmitter<string> = new EventEmitter<string>();

    public onKeyUp($event: KeyboardEvent): void {
        const ENTER = 13;
        const ESC = 27;

        if ($event.which === ENTER) {
            this.update.emit(this.term);
            this.clear();
        }

        if ($event.which === ESC) {
            this.clear();
        }
    }

    private clear(): void {
        this.term = '';
    }
}
