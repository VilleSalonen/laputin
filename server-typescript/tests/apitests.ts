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
        let file: File = new File("aaaaa", "funny.jpg", "funny.jpg", []);
        
        before((done) => {
            initializeLaputin("adding-files")
                .then((l) => { laputin = l; })
                .then(() => { return laputin.library.addFile(file); })
                .then(done);
        });
        
        it("Added file can be found", (done) => {
            request(laputin.app)
                .get("/files")
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    
                    var values = JSON.parse(res.text);
                    values.should.have.length(1);
                    values[0].should.eql(file);
                    
                    done();
                });
        });
    });
    
    describe("Adding a tag", () => {
        let laputin: Laputin;
        
        before((done) => {
            initializeLaputin("adding-tags")
                .then((l) => { laputin = l; })
                .then(() => { laputin.library.createNewTag("Funny"); })
                .then(done);
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
                .get("/tags")
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    
                    var values = JSON.parse(res.text);
                    values.should.have.length(0);
                    
                    done();
                });
        });
    });

    describe("Tagging a file", () => {
        let laputin: Laputin;
        let file: File = new File("aaaaa", "funny.jpg", "funny.jpg", []);
        let tag: Tag;
        
        before((done) => {
            initializeLaputin("tagging-files")
                .then((l) => { laputin = l; })
                .then(() => { return laputin.library.addFile(file); })
                .then(() => { return laputin.library.createNewTag("Funny"); })
                .then((t) => { tag = t })
                .then(done);
        });
        
        it("File can be tagged", (done) => {
            request(laputin.app)
                .post("/files/" + file.hash + "/tags")
                .send({ selectedTags: [tag], hash: file.hash })
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    
                    request(laputin.app)
                        .get("/files")
                        .expect(200)
                        .end((err, res) => {
                            if (err) throw err;
                            
                            var values = JSON.parse(res.text);
                            values.should.have.length(1);
                            values[0].should.have.property("hash", file.hash);
                            values[0].tags.should.have.length(1);
                            values[0].tags[0].should.eql(tag);
                            
                            done();
                        });
                });
        });
    });
});   

function initializeLaputin(path: string): Promise<Laputin> {
    var archivePath = "deploy-tests/" + path;
    
    rimraf.sync(archivePath);
    fs.mkdirSync(archivePath);

    var laputin = new Laputin(archivePath);
    return laputin.library.createTables().then(() => {
        return laputin;
    });
} 
