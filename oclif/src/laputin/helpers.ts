import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function getLibraryPathByFile(givenFilePath: string): string {
    var libraryPath = '';
    var libraryPathCandidate = givenFilePath;
    do {
        var parentDirectory = path.dirname(libraryPathCandidate);
        if (parentDirectory === libraryPathCandidate) {
            throw new Error('Could not find library path based on file path.');
        }

        const foo = path.join(parentDirectory, 'laputin.db');
        if (fs.existsSync(foo)) {
            libraryPath = parentDirectory;
            break;
        }

        libraryPathCandidate = parentDirectory;
    } while (libraryPath === '');

    return getLibraryPath(libraryPath);
}

export function getLibraryPath(givenLibraryPath?: string): string {
    if (!givenLibraryPath) {
        throw new Error('Library path not provided!');
    }

    const normalizedPath = path.normalize(givenLibraryPath);
    if (normalizedPath.includes(path.sep)) {
        return normalizedPath;
    }

    // Assume that user only passed library name under home directory .laputin directory.
    const assumedLibraryPath = path.join(
        os.homedir(),
        '.laputin',
        givenLibraryPath
    );
    if (fs.existsSync(assumedLibraryPath)) {
        return assumedLibraryPath;
    }

    throw new Error(
        `Could not determine library path from ${givenLibraryPath}`
    );
}
