import {Component, Input, EventEmitter, Injectable, Inject} from "@angular/core";
import * as _ from "lodash";

import {LaputinService} from "./../services/laputinservice";
import {File} from "./../models/file";
import {FileQuery} from "./../models/filequery";
import {Tag} from "./../models/tag";

@Component({
    selector: "file-row",
    template: `
        <div>
            <div *ngIf="!detailsOpen">
                <p><a (click)="toggle()">{{file.path}}</a></p>
                
                <p>{{formattedTags()}}</p>
            </div>

            <div *ngIf="detailsOpen">
                <p><strong><a (click)="toggle()">{{file.path}}</a></strong></p>
            
                <div class="row">
                    <div class="col-md-2">
                        <p>
                            <tag-autocomplete [tagContainer]="file" (select)="addTag($event)"></tag-autocomplete>
                        </p>
                        
                        <p>
                            <small><a (click)="toggleTagCreation()">Didn't find the tag you were looking for..?</a></small>
                        </p>
                        
                        <div *ngIf="tagCreationOpen">
                            <search-box (update)="addNewTag($event)" clearOnEnter="1"></search-box>
                        </div>

                        <p><small><a (click)="copy()">Copy</a> <a (click)="paste()">Paste</a></small></p>
                        <p><small><a (click)="openFile()">Open</a></small></p>
                    </div>
                    
                    <div class="col-md-10">
                        <p><video src="/media/{{file.path}}" controls width="100%"></video></p>
                    
                        <p>
                            <span *ngFor="let tag of file.tags">
                                <button (click)="removeTag(tag)" class="btn btn-success tag">{{tag.name}}</button>
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>`,
    providers: [LaputinService]
})
@Injectable()
export class FileRowComponent {
    @Input() file: File;
    
    public detailsOpen: boolean = false;
    public tagCreationOpen: boolean = false;
    
    constructor(@Inject(LaputinService) private _service: LaputinService) {
    }
    
    public toggle(): void {
        this.detailsOpen = !this.detailsOpen;
    }
    
    public toggleTagCreation(): void {
        this.tagCreationOpen = !this.tagCreationOpen;
    }
    
    public addNewTag(newTag: string): void {
        this._service.createTag(this.file, newTag)
                     .subscribe(tag => {
                        this._service.addTag(this.file, tag)
                            .subscribe(() => this.addTagsToFile([tag]));
                     });
    }
    
    public addTag(tag: Tag): void {
        this.addTags([tag]);
    }
    
    public addTags(tags: Tag[]): void {
        this._service.addTags(this.file, tags)
                     .subscribe(() => this.addTagsToFile(tags));
    }
    
    public removeTag(tag: Tag): void {
        var tags = this.file.tags;
        this.file.tags = _.filter(this.file.tags, (t: Tag): boolean => t.id !== tag.id);
        this._service.deleteTagFileAssoc(this.file, tag)
            .subscribe(() => {});
    }
    
    private addTagsToFile(tags: Tag[]): void {
        var currentTags = this.file.tags;
        _.each(tags, (tag: Tag) => currentTags.push(tag));
        var sorted = _.sortBy(currentTags, (tag: Tag) => tag.name);
        this.file.tags = sorted;
    }
    
    public openFile(): void {
        var query = new FileQuery();
        query.hash = this.file.hash;
        
        this._service.openFiles(query);
    }
    
    public copy(): void {
        localStorage.setItem("tagClipboard", JSON.stringify(this.file.tags));
    }

    public paste(): void {
        var tags = JSON.parse(localStorage.getItem("tagClipboard"));
        this.addTags(tags);
    }
    
    public formattedTags(): string {
        return _.map(this.file.tags, (tag) => tag.name).join(", ");
    }
}