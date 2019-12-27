import { Component, OnInit } from '@angular/core';
import { LaputinService } from '../laputin.service';
import { FileQueryService } from '../file-query.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FileQuery, File, FileChange, ChangeDirection } from '../models';
import { map, switchMap, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-file',
    templateUrl: './file.component.html',
    styleUrls: ['./file.component.scss']
})
export class FileComponent implements OnInit {
    public activeFile$: Observable<File>;

    constructor(
        private laputinService: LaputinService,
        private fileQueryService: FileQueryService,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {
        this.activeFile$ = this.activatedRoute.params.pipe(
            map(params => params['hash']),
            map(hash => new FileQuery({ hash: hash })),
            switchMap(query => this.laputinService.queryFiles(query)),
            map(files => files[0])
        );
    }

    ngOnInit() {}

    public changeActiveFile(fileChange: FileChange): void {
        this.fileQueryService.query$
            .pipe(
                switchMap(query => this.laputinService.queryFiles(query)),
                map(files => {
                    const activeIndex = files.findIndex(
                        f => f.hash === fileChange.currentFile.hash
                    );

                    let newIndex: number;
                    if (fileChange.random) {
                        newIndex = Math.floor(
                            Math.random() * (files.length - 1)
                        );
                    } else {
                        if (fileChange.direction === ChangeDirection.Previous) {
                            newIndex = activeIndex - 1;
                        } else {
                            newIndex = activeIndex + 1;
                        }
                    }

                    if (newIndex < 0 || newIndex >= files.length) {
                        return files[0];
                    }

                    return files[newIndex];
                }),
                take(1)
            )
            .subscribe(file => this.router.navigate(['/files', file.hash]));
    }
}
