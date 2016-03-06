import {Laputin} from "./laputin";
import {Library} from "./library";
import {LaputinConfiguration} from "./laputinconfiguration";
import {IHasher} from "./ihasher";
import {Sha512Hasher} from "./sha512hasher";
import {QuickMD5Hasher} from "./quickmd5hasher";
import {FileLibrary} from "./filelibrary";

export function compose(libraryPath: string, configuration: LaputinConfiguration): Laputin {
    let library = new Library(libraryPath);
    
    let hasher: IHasher = composeHasher(configuration);    
    let fileLibrary = new FileLibrary(libraryPath, hasher);

    return new Laputin(libraryPath, library, fileLibrary);
}

function composeHasher(configuration: LaputinConfiguration): IHasher {
    return (configuration.identification == "quick")
        ? new QuickMD5Hasher()
        : new Sha512Hasher();
}