import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'fileSize',
})
export class FileSizePipe implements PipeTransform {
    transform(file: File): string {
        if (file.size < 1000) {
            return file.size + ' B';
        } else if (file.size < 1000000) {
            return (file.size / 1000.0).toFixed(1) + ' kB';
        } else if (file.size < 1000000000) {
            return (file.size / 1000000.0).toFixed(1) + ' MB';
        } else {
            return (file.size / 1000000000.0).toFixed(1) + ' GB';
        }
    }
}
