import fs = require('fs');
import path = require('path');

export function getLibraryPathByFile(givenFilePath: string): string {
    var libraryPath = '';
    var libraryPathCandidate = givenFilePath;
    do {
        var parentDirectory = path.dirname(libraryPathCandidate);
        if (parentDirectory === libraryPathCandidate) {
            throw new Error('Could not find library path based on file path.');
        }

        const foo = path.join(parentDirectory, '.laputin.db');
        if (fs.existsSync(foo)) {
            libraryPath = parentDirectory;
            break;
        }

        libraryPathCandidate = parentDirectory;
    } while (libraryPath === '');

    return getLibraryPath(libraryPath);
}

export function getLibraryPath(givenLibraryPath?: string): string {
    const libraryPath = givenLibraryPath || process.cwd();

    // For some reason " is added only to the end of the path if path contains spaces.
    return libraryPath.replace(/\"/g, '');
}
