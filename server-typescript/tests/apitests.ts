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
        
        before(async () => {
            laputin = await initializeLaputin("adding-files");
            return laputin.library.addFile(file);
        });
        
        it("Added file can be found", () => shouldContainFiles(laputin, [file]));
    });
    
    describe("Adding a tag", () => {
        let laputin: Laputin;
        let tag: Tag;
        
        before(async () => {
            laputin = await initializeLaputin("adding-tags");
            tag = await laputin.library.createNewTag("Funny");
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
        
        before(async () => {
            laputin = await initializeLaputin("tagging-files");
            tag = await laputin.library.createNewTag("Funny");
            return laputin.library.addFile(file);
        });
        
        it("File can be tagged", async () => {
            await request(laputin.app)
                .post("/files/" + file.hash + "/tags")
                .send({ selectedTags: [tag], hash: file.hash })
                .expect(200);

            await shouldContainFiles(laputin, [new File(file.hash, file.path, file.name, [tag])]);
        });
        
        it("File tagging can be removed", async () => {
            await request(laputin.app)
                .delete("/files/" + file.hash + "/tags/" + tag.id)
                .send({ tagId: tag.id, hash: file.hash })
                .expect(200);

            await shouldContainFiles(laputin, [new File(file.hash, file.path, file.name, [])]);
        });
    });

    describe("Deactivating files", () => {
        let laputin: Laputin;
        let file1: File = new File("aaaaa", "funny.jpg", "funny.jpg", []);
        let file2: File = new File("bbbbb", "educational.jpg", "educational.jpg", []);
        let file3: File = new File("ccccc", "serious.jpg", "serious.jpg", []);
        
        before(async () => {
            laputin = await initializeLaputin("deactivating-files"); 
            await laputin.library.addFile(file1);
            await laputin.library.addFile(file2);
            await laputin.library.addFile(file3);
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
    
    async function initializeLaputin(path: string): Promise<Laputin> {
        var archivePath = "deploy-tests/" + path;
        
        rimraf.sync(archivePath);
        fs.mkdirSync(archivePath);

        var laputin = new Laputin(archivePath);
        laputin.initializeRoutes();
        
        await laputin.library.createTables();
        return laputin;
    } 

    function shouldContainFiles(laputin: Laputin, expectedFiles: File[]): request.Test {
        return request(laputin.app)
                .get("/files")
                .expect(200)
                .expect(expectedFiles);
    }
});
