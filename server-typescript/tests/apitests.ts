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
                .expect([file], done);
        });
    });
    
    describe("Adding a tag", () => {
        let laputin: Laputin;
        let tag: Tag;
        
        before((done) => {
            initializeLaputin("adding-tags")
                .then((l) => { laputin = l; })
                .then(() => { return laputin.library.createNewTag("Funny"); })
                .then((t) => { tag = t; })
                .then(done);
        });
        
        it("Added tag can be found from unassociated tags", (done) => {
            request(laputin.app)
                .get("/tags?unassociated=true")
                .expect(200)
                .expect([tag], done);
        });
        
        it("Added tag can _not_ be found from associated tags", (done) => {
            request(laputin.app)
                .get("/tags")
                .expect(200)
                .expect([], done);
        });
        
        it("Creating duplicate tag returns error", (done) => {
            request(laputin.app)
                .post("/tags")
                .send({ tagName: tag.name })
                .expect(500, done);
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
                            
                            var expected = [new File(file.hash, file.path, file.name, [tag])];
                            values.should.eql(expected);
                            
                            done();
                        });
                });
        });
        
        it("File tagging can be removed", (done) => {
            request(laputin.app)
                .delete("/files/" + file.hash + "/tags/" + tag.id)
                .send({ tagId: tag.id, hash: file.hash })
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    
                    request(laputin.app)
                        .get("/files")
                        .expect(200)
                        .end((err, res) => {
                            if (err) throw err;
                            
                            var values = JSON.parse(res.text);
                            
                            var expected = [new File(file.hash, file.path, file.name, [])];
                            values.should.eql(expected);
                            
                            done();
                        });
                });
        });
    });

    describe("Deactivating files", () => {
        let laputin: Laputin;
        let file1: File = new File("aaaaa", "funny.jpg", "funny.jpg", []);
        let file2: File = new File("bbbbb", "educational.jpg", "educational.jpg", []);
        let file3: File = new File("ccccc", "serious.jpg", "serious.jpg", []);
        
        before((done) => {
            initializeLaputin("deactivating-files")
                .then((l) => { laputin = l; })
                .then(() => { return laputin.library.addFile(file1); })
                .then(() => { return laputin.library.addFile(file2); })
                .then(() => { return laputin.library.addFile(file3); })
                .then(done);
        });
        
        it("A single file can be deactivated", (done) => {
            laputin.library.deactivateFile(file1);
            
            request(laputin.app)
                .get("/files")
                .expect(200)
                .expect([file2, file3], done);
        });

        it("All files can be deactivated", (done) => {
            laputin.library.deactivateAll();
            
            request(laputin.app)
                .get("/files")
                .expect(200)
                .expect([], done);
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
