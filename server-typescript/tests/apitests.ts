/// <reference path="../typings/main.d.ts" />

import chai = require("chai");
var expect = chai.expect;
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
        
        before(() => {
            return initializeLaputin("adding-files")
                .then((l) => { laputin = l; })
                .then(() => { return laputin.library.addFile(file); });
        });
        
        it("Added file can be found", () => shouldContainFiles(laputin, [file]));
    });
    
    describe("Adding a tag", () => {
        let laputin: Laputin;
        let tag: Tag;
        
        before(() => {
            return initializeLaputin("adding-tags")
                .then((l) => { laputin = l; })
                .then(() => { return laputin.library.createNewTag("Funny"); })
                .then((t) => { tag = t; });
        });
        
        it("Added tag can be found from unassociated tags", () => {
            return request(laputin.app)
                .get("/tags?unassociated=true")
                .expect(200)
                .expect([tag]);
        });
        
        it("Added tag can _not_ be found from associated tags", () => {
            return request(laputin.app)
                .get("/tags")
                .expect(200)
                .expect([]);
        });
        
        it("Creating duplicate tag returns error", () => {
            return request(laputin.app)
                .post("/tags")
                .send({ tagName: tag.name })
                .expect(500);
        });

        it("Creating tag with empty name returns error", () => {
            return request(laputin.app)
                .post("/tags")
                .send({ tagName: "" })
                .expect(500);
        });
    });

    describe("Tagging a file", () => {
        let laputin: Laputin;
        let file: File = new File("aaaaa", "funny.jpg", "funny.jpg", []);
        let tag: Tag;
        
        before(() => {
            return initializeLaputin("tagging-files")
                .then((l) => { laputin = l; })
                .then(() => { return laputin.library.addFile(file); })
                .then(() => { return laputin.library.createNewTag("Funny"); })
                .then((t) => { tag = t });
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
                            expect(values).to.eql(expected);
                            
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
                            expect(values).to.eql(expected);
                            
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
        
        before(() => {
            return initializeLaputin("deactivating-files")
                .then((l) => { laputin = l; })
                .then(() => { return laputin.library.addFile(file1); })
                .then(() => { return laputin.library.addFile(file2); })
                .then(() => { return laputin.library.addFile(file3); });
        });
        
        it("A single file can be deactivated", () => {
            laputin.library.deactivateFile(file1);
            return shouldContainFiles(laputin, [file2, file3]);
        });

        it("All files can be deactivated", () => {
            laputin.library.deactivateAll();
            return shouldContainFiles(laputin, []);
        });
    });
    
    function initializeLaputin(path: string): Promise<Laputin> {
        var archivePath = "deploy-tests/" + path;
        
        rimraf.sync(archivePath);
        fs.mkdirSync(archivePath);

        var laputin = new Laputin(archivePath);
        laputin.initializeRoutes();
        return laputin.library.createTables().then(() => {
            return laputin;
        });
    } 

    function shouldContainFiles(laputin: Laputin, expectedFiles: File[]): request.Test {
        return request(laputin.app)
                .get("/files")
                .expect(200)
                .expect(expectedFiles);
    }
});
