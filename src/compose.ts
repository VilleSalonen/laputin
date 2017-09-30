import {Laputin} from './laputin';
import {Library} from './library';
import {LaputinConfiguration} from './laputinconfiguration';
import {IHasher} from './ihasher';
import {Sha512Hasher} from './sha512hasher';
import {QuickMD5Hasher} from './quickmd5hasher';
import {FileLibrary} from './filelibrary';
import {VLCOpener} from './vlcopener';

export function compose(libraryPath: string, configuration: LaputinConfiguration): Laputin {
    const library = new Library(libraryPath);

    const hasher: IHasher = composeHasher(configuration);
    const fileLibrary = new FileLibrary(libraryPath, hasher);

    const opener = new VLCOpener(libraryPath);

    return new Laputin(libraryPath, library, fileLibrary, opener, configuration.port);
}

function composeHasher(configuration: LaputinConfiguration): IHasher {
    return (configuration.identification === 'quick')
        ? new QuickMD5Hasher()
        : new Sha512Hasher();
}
