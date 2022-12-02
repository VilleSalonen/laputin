import * as fsLegacy from 'fs';
import os = require('os');
import path = require('path');

export async function getLibraryPath(givenLibraryPath?: string): Promise<string> {
    if (!givenLibraryPath) {
        throw new Error('Library path not provided!');
    }

    const normalizedPath = path.normalize(givenLibraryPath);
    if (normalizedPath.includes(path.sep)) {
        return normalizedPath;
    }

    // Assume that user only passed library name under home directory .laputin directory.
    const assumedLibraryPath = path.join(os.homedir(), '.laputin', givenLibraryPath);
    if (fsLegacy.existsSync(assumedLibraryPath)) {
        return assumedLibraryPath;
    }

    throw new Error(`Could not determine library path from ${givenLibraryPath}`);
}
