import chai = require("chai");
var expect = chai.expect;
import fs = require("fs");
import rimraf = require("rimraf");
import request = require("supertest");

import {File} from "./../file";
import {Tag} from "./../tag";
import {compose} from "./../compose";
import {Laputin} from "./../laputin";
import {LaputinConfiguration} from "./../laputinconfiguration";

describe("Laputin API", function() {
    let currentPath: string;
    let laputin: Laputin;

    beforeEach(async function() {
        currentPath = this.currentTest.title.toLowerCase().replace(/ /g, "_");
        laputin = await initializeLaputin(currentPath);
    });
    
    afterEach(async function() {
        await laputin.stopListening();
    });

    it("Added file can be found", async () => {
        let file: File = new File("aaaaa11111", "new_funny_pic.jpg", []);

        await laputin.library.addFile(file);

        return shouldContainFiles(laputin, [file]);
    });

    it("Added tag can be found from unassociated tags", async () => {
        let tag = await laputin.library.createNewTag("Educational");

        return request(laputin.app)
            .get("/api/tags?unassociated=true")
            .expect(200)
            .expect([tag]);
    });

    it("Added tag can _not_ be found from associated tags", async () => {
        let tag = await laputin.library.createNewTag("Hilarious");

        return request(laputin.app)
            .get("/api/tags")
            .expect(200)
            .expect([]);
    });

    it("Creating duplicate tag returns error", async () => {
        let tag = await laputin.library.createNewTag("Seeing double");

        return request(laputin.app)
            .post("/api/tags")
            .send({ tagName: tag.name })
            .expect(500);
    });

    it("Creating tag with empty name returns error", () => {
        return request(laputin.app)
            .post("/api/tags")
            .send({ tagName: "" })
            .expect(500);
    });

    it("File can be tagged", async () => {
        let file: File = new File("aaaaa", "funny.jpg", []);

        let tag = await laputin.library.createNewTag("Funny");
        await laputin.library.addFile(file);

        await request(laputin.app)
            .post("/api/files/" + file.hash + "/tags")
            .send({ selectedTags: [tag] })
            .expect(200);

        await shouldContainFiles(laputin, [new File(file.hash, file.path, [tag])]);
    });

    it("File tagging can be removed", async () => {
        let file: File = new File("aaaaa", "funny.jpg", []);

        let tag = await laputin.library.createNewTag("Funny");
        await laputin.library.addFile(file);

        await request(laputin.app)
            .post("/api/files/" + file.hash + "/tags")
            .send({ selectedTags: [tag] })
            .expect(200);

        await request(laputin.app)
            .delete("/api/files/" + file.hash + "/tags/" + tag.id)
            .send({ tagId: tag.id })
            .expect(200);

        await shouldContainFiles(laputin, [new File(file.hash, file.path, [])]);
    });

    it("Querying both tagged and untagged files", async () => {
        let taggedFile: File = new File("aaaaa", "funny.jpg", []);
        let untaggedFile: File = new File("bbbbb", "untagged.jpg", []);

        await laputin.library.addFile(taggedFile);
        await laputin.library.addFile(untaggedFile);

        let tag = await laputin.library.createNewTag("Funnyyyy");
        await request(laputin.app)
            .post("/api/files/" + taggedFile.hash + "/tags")
            .send({ selectedTags: [tag] })
            .expect(200);

        return request(laputin.app)
            .get("/api/files?status=both")
            .expect(200)
            .expect([
                new File(taggedFile.hash, taggedFile.path, [tag]),
                untaggedFile]);
    });

    it("Querying only tagged", async () => {
        let taggedFile: File = new File("aaaaa", "funny.jpg", []);
        let untaggedFile: File = new File("bbbbb", "untagged.jpg", []);

        await laputin.library.addFile(taggedFile);
        await laputin.library.addFile(untaggedFile);

        let tag = await laputin.library.createNewTag("Funnyyyy");
        await request(laputin.app)
            .post("/api/files/" + taggedFile.hash + "/tags")
            .send({ selectedTags: [tag] })
            .expect(200);

        return request(laputin.app)
            .get("/api/files?status=tagged")
            .expect(200)
            .expect([new File(taggedFile.hash, taggedFile.path, [tag])]);
    });

    it("Querying only untagged", async () => {
        let taggedFile: File = new File("aaaaa", "funny.jpg", []);
        let untaggedFile: File = new File("bbbbb", "untagged.jpg", []);

        await laputin.library.addFile(taggedFile);
        await laputin.library.addFile(untaggedFile);

        let tag = await laputin.library.createNewTag("Funnyyyy");
        await request(laputin.app)
            .post("/api/files/" + taggedFile.hash + "/tags")
            .send({ selectedTags: [tag] })
            .expect(200);

        return request(laputin.app)
            .get("/api/files?status=untagged")
            .expect(200)
            .expect([untaggedFile]);
    });

    it("A single file can be deactivated", async () => {
        let file1: File = new File("aaaaa", "funny.jpg", []);
        let file2: File = new File("bbbbb", "educational.jpg", []);
        let file3: File = new File("ccccc", "serious.jpg", []);

        await laputin.library.addFile(file1);
        await laputin.library.addFile(file2);
        await laputin.library.addFile(file3);

        laputin.library.deactivateFile(file1);
        return shouldContainFiles(laputin, [file2, file3]);
    });

    it("All files can be deactivated", async () => {
        let file1: File = new File("aaaaa", "funny.jpg", []);
        let file2: File = new File("bbbbb", "educational.jpg", []);
        let file3: File = new File("ccccc", "serious.jpg", []);

        await laputin.library.addFile(file1);
        await laputin.library.addFile(file2);
        await laputin.library.addFile(file3);

        laputin.library.deactivateAll();
        return shouldContainFiles(laputin, []);
    });

    async function initializeLaputin(path: string): Promise<Laputin> {
        var archivePath = "deploy-tests/" + path;

        rimraf.sync(archivePath);
        fs.mkdirSync(archivePath);

        var laputin = compose(archivePath, new LaputinConfiguration(null));
        laputin.initializeRoutes();

        await laputin.library.createTables();
        
        await laputin.startListening();
        
        return laputin;
    }

    function shouldContainFiles(laputin: Laputin, expectedFiles: File[]): request.Test {
        return request(laputin.app)
            .get("/api/files")
            .expect(200)
            .expect(expectedFiles);
    }
});
