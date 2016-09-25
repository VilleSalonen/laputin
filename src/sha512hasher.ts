import crypto = require("crypto");
import fs = require("fs");

import {IHasher} from "./ihasher";

export class Sha512Hasher implements IHasher {
    public hash(path: string): Promise<any> {
        var done: Function;
        var promise = new Promise<File>((resolve, reject) => done = resolve);
        
        var shasum = crypto.createHash("sha512");

        try {
            var s = fs.createReadStream(path);
            s.on('data', (d: any) => { shasum.update(d); });
            s.on('end', () => {
                var hash = shasum.digest('hex');
                done({ path: path, hash: hash });
            });
        }
        catch (e) {
            if (e.name === "TypeError" && e.message === "Bad argument")
            {
                // If hashing is done when file is still being copied, it will
                // fail.
            }
            else {
                throw e;
            }
        }
        
        return promise;
    }
}