import fs = require('fs/promises');
import os = require('os');
import path = require('path');

export async function getLibraryPathByFile(
    givenFilePath: string
): Promise<string> {
    var libraryPath = '';
    var libraryPathCandidate = givenFilePath;
    do {
        var parentDirectory = path.dirname(libraryPathCandidate);
        if (parentDirectory === libraryPathCandidate) {
            throw new Error('Could not find library path based on file path.');
        }

        const databasePath = path.join(parentDirectory, 'laputin.db');
        const databaseStat = await fs.stat(databasePath);
        if (databaseStat) {
            libraryPath = parentDirectory;
            break;
        }

        libraryPathCandidate = parentDirectory;
    } while (libraryPath === '');

    return getLibraryPath(libraryPath);
}

export async function getLibraryPath(
    givenLibraryPath?: string
): Promise<string> {
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
    const assumedLibraryStat = await fs.stat(assumedLibraryPath);
    if (assumedLibraryStat) {
        return assumedLibraryPath;
    }

    throw new Error(
        `Could not determine library path from ${givenLibraryPath}`
    );
}
