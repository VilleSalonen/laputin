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

describe("Laputin API", () => {
    describe("Adding a file", () => {
        let laputin: Laputin;
        
        before((done) => {
            initializeLaputin("adding-files", (l) => {
                laputin = l;
                
                var file = new File(
                    "aaaaa",
                    "funny.jpg",
                    "funny.jpg",
                    []);
                
                laputin.library.createTables(() => {
                    laputin.library.addFile(file, done);                
                });
            });
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
    
    describe("Adding a tag", () => {
        let laputin: Laputin;
        
        before((done) => {
            initializeLaputin("adding-tags", (l) => {
                laputin = l;
                
                laputin.library.createTables(() => {
                    laputin.library.createNewTag("Funny", done);
                });
            });
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

function initializeLaputin(path: string, callback: ((laputin: Laputin) => void)): void {
    var archivePath = "deploy-tests/" + path;
    
    rimraf.sync(archivePath);
    fs.mkdirSync(archivePath);

    var laputin = new Laputin(archivePath);
    laputin.library.createTables(() => {
        callback(laputin);
    });
} 
