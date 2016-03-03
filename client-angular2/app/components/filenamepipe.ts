import {Pipe} from "angular2/core";

import {File} from "./../models/file";

@Pipe({
    name: "filenamefilter"
})
export class FileNamePipe {
    transform(files: File[], [term]): File[] {
        return files.filter((file: File) => file.path.toLowerCase().includes(term.toLowerCase()));
    }
}