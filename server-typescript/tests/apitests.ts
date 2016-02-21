/// <reference path="../typings/tsd.d.ts" />

// Because should extends other prototypes and is not directly used, Typescript
// compiler omits it. To circumvent this, should is placed in a local variable
// so compiler understands that it is actually used.
import should = require("should");
var persist = should;

import fs = require("fs");
import rimraf = require("rimraf");

import request = require("supertest");

import {File} from "./../file";
import {Tag} from "./../tag";
import {Laputin} from "./../server";

rimraf.sync("deploy-tests/test-archive");
fs.mkdirSync("deploy-tests/test-archive");

var laputin = new Laputin("deploy-tests/test-archive");

describe("Laputin API", () => {
    before((done) => {
        laputin.library.createTables(done);
    });
    
    describe("Files", () => {
        before((done) => {
            var file = new File(
                "aaaaa",
                "funny.jpg",
                "funny.jpg",
                []);
                
            laputin.library.addFile(file, done);
        });
        
        it("Added file can be found", (done) => {
            request(laputin.app)
                .get("/files")
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    
                    var values = JSON.parse(res.text);
                    values.should.have.length(1);
                    values[0].should.eql(new File(
                        "aaaaa",
                        "funny.jpg",
                        "funny.jpg",
                        []));
                    
                    done();
                });
        });
    });
    
    describe("Tags", () => {
        before((done) => {
            laputin.library.createNewTag("Funny", done);
        });
        
        it("Added tag can be found from unassociated tags", (done) => {
            request(laputin.app)
                .get("/tags?unassociated=true")
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    
                    var values = JSON.parse(res.text);
                    values.should.have.length(1);
                    values[0].should.eql(new Tag(1, "Funny", 0));
                    
                    done();
                });
        });
        
        it("Added tag can _not_ be found from associated tags", (done) => {
            request(laputin.app)
                .get("/tags?unassociated=false")
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    
                    var values = JSON.parse(res.text);
                    values.should.have.length(1);
                    values[0].should.eql(new Tag(1, "Funny", 0));
                    
                    done();
                });
        });
    })
});    
