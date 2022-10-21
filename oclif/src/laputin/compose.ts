import { Laputin } from './laputin';
import { Library } from './library';
import { LaputinConfiguration } from './laputinconfiguration';
import { IHasher } from './ihasher';
import { QuickMD5Hasher } from './quickmd5hasher';
import { FileLibrary } from './filelibrary';
import { VLCOpener } from './vlcopener';
import { Screenshotter } from './screenshotter';

export function compose(
    libraryPath: string,
    configuration: LaputinConfiguration
): Laputin {
    const library = new Library(libraryPath);

    const screenshotter = new Screenshotter(libraryPath, library);

    const hasher: IHasher = composeHasher();
    const fileLibrary = new FileLibrary(
        library,
        hasher,
        screenshotter,
        false,
        configuration
    );

    const opener = new VLCOpener(libraryPath);

    return new Laputin(
        libraryPath,
        library,
        fileLibrary,
        opener,
        configuration
    );
}

export function composeForTests(
    libraryPath: string,
    configuration: LaputinConfiguration,
    screenshotter: Screenshotter
): Laputin {
    const library = new Library(libraryPath);

    const hasher: IHasher = composeHasher();
    const fileLibrary = new FileLibrary(
        library,
        hasher,
        screenshotter,
        true,
        configuration
    );

    const opener = new VLCOpener(libraryPath);

    return new Laputin(
        libraryPath,
        library,
        fileLibrary,
        opener,
        configuration
    );
}

function composeHasher(): IHasher {
    return new QuickMD5Hasher();
}
