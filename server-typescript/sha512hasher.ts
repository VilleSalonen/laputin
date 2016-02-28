/// <reference path="typings/main.d.ts" />

import crypto = require("crypto");
import fs = require("fs");

import {IHasher} from "./ihasher";

export class Sha512Hasher implements IHasher {
    public hash(path: string, callback: ((f: any) => void)): void {
        var shasum = crypto.createHash("sha512");

        try {
            var s = fs.createReadStream(path);
            s.on('data', (d: any) => { shasum.update(d); });
            s.on('end', () => {
                var d = shasum.digest('hex');
                if (typeof callback !== "undefined") {
                    callback({ path: path, hash: d });
                }
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
    }
}