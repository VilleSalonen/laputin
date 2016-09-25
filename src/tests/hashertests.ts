import chai = require("chai");
var expect = chai.expect;
import fs = require("fs");
import rimraf = require("rimraf");
import request = require("supertest");

import {Sha512Hasher} from "./../sha512hasher";
import {QuickMD5Hasher} from "./../quickmd5hasher";

describe("Hasher tests", function() {
    it("SHA-512 hasher", async () => {
        let hasher = new Sha512Hasher();
        let result = await hasher.hash("tests/test-content/cats.jpg");
        
        expect(result.hash).to.eql("70342c64bed51a0921b68e2df2fe893bc52c89454ee2dcb47aff436b7259d71805dbaf36838db76a7e919ba6249273d261b0f892b8b4958748350ff1f25d572e");
    });

    it("Quick MD5 hasher", async () => {
        let hasher = new QuickMD5Hasher();
        let result = await hasher.hash("tests/test-content/cats.jpg");
        
        expect(result.hash).to.eql("ea411d1af31ebb729a37c58c8e34236c");
    });
});
