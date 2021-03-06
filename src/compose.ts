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

    const hasher: IHasher = composeHasher(configuration);
    const fileLibrary = new FileLibrary(
        library,
        libraryPath,
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
        configuration.port,
        configuration.proxyDirectory
    );
}

export function composeForTests(
    libraryPath: string,
    configuration: LaputinConfiguration,
    screenshotter: Screenshotter
): Laputin {
    const library = new Library(libraryPath);

    const hasher: IHasher = composeHasher(configuration);
    const fileLibrary = new FileLibrary(
        library,
        libraryPath,
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
        configuration.port,
        configuration.proxyDirectory
    );
}

function composeHasher(configuration: LaputinConfiguration): IHasher {
    return new QuickMD5Hasher();
}
