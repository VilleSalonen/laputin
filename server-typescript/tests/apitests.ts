/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/supertest/supertest.d.ts" />
/// <reference path="../typings/should/should.d.ts" />

// Because should extends other prototypes and is not directly used, Typescript
// compiler omits it. To circumvent this, should is placed in a local variable
// so compiler understands that it is actually used.
import should = require("should");
var persist = should;

import request = require("supertest");

import {server, lib} from "./../server";
import {File} from "./../file";
import {Tag} from "./../tag";

describe("Laputin API", () => {
    before((done) => {
        lib.createTables(done);
    });
    
    describe("Files", () => {
        before((done) => {
            var file = new File(
                "aaaaa",
                "funny.jpg",
                "funny.jpg",
                []);
                
            lib.addFile(file, done);
        });
        
        it("Added file can be found", (done) => {
            request(server)
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
            lib.createNewTag("Funny", done);
        });
        
        it("Added tag can be found from unassociated tags", (done) => {
            request(server)
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
            request(server)
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
