/// <reference path="../typings/main.d.ts" />

import chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;

import fs = require("fs");
import rimraf = require("rimraf");
import request = require("supertest");
import events = require("events");

import {File} from "./../file";
import {Tag} from "./../tag";
import {Laputin} from "./../server";

describe("File Library", function () {
    // For some reason watching for file changes seems to always take about 5
    // seconds to notify about the changes. Normal timeout for mocha tests is
    // 2 seconds so we need to increase the timeout.
    this.timeout(10000);

    describe("No initial files in library path", () => {
        let carFile = new File("32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592",
            "deploy-tests\\monitor-adding-files\\car.jpg",
            "deploy-tests\\monitor-adding-files\\car.jpg",
            []);
        
        let laputin: Laputin;
        
        before(async () => {
            laputin = await initializeLaputin("monitor-adding-files")
        });
        
        after(() => {
            laputin.fileLibrary.close();
        });
        
        it("No files can be found", () => shouldContainFiles(laputin, []));
        
        it("When file is copied to library path, it can be found", async function () {
            await copyFile("tests/test-content/car.jpg", "deploy-tests/monitor-adding-files/car.jpg");
            await waitForEvent(laputin.fileLibrary, "found", 8000);
            return shouldContainFiles(laputin, [carFile]);
        });
    });
    
    describe("Initial files in library path", () => {
        let laputin: Laputin;
        let carFile = new File("32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592",
            "deploy-tests\\monitor-initial-files\\car.jpg",
            "deploy-tests\\monitor-initial-files\\car.jpg",
            []);
        let catsFile = new File("70342c64bed51a0921b68e2df2fe893bc52c89454ee2dcb47aff436b7259d71805dbaf36838db76a7e919ba6249273d261b0f892b8b4958748350ff1f25d572e",
            "deploy-tests\\monitor-initial-files\\cats.jpg",
            "deploy-tests\\monitor-initial-files\\cats.jpg",
            []);
        let landscapeFile = new File("44f332dadcd09cc73c14b30a8334c1bf7d615829dd111f47fa9d3ae212933e32cbf59cd700010bd0e950309d64c23b03badcb990170676e003a0b02b63d3e757",
            "deploy-tests\\monitor-initial-files\\jyvasjarvi.jpg",
            "deploy-tests\\monitor-initial-files\\jyvasjarvi.jpg",
            []);
            
        let duplicateCarFile = new File("32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592",
            "deploy-tests\\monitor-initial-files\\car-duplicate.jpg",
            "deploy-tests\\monitor-initial-files\\car-duplicate.jpg",
            []);
        
        before(async () => {
            fs.mkdirSync("deploy-tests/monitor-initial-files");
            
            await copyFile("tests/test-content/car.jpg", "deploy-tests/monitor-initial-files/car.jpg");
            await copyFile("tests/test-content/cats.jpg", "deploy-tests/monitor-initial-files/cats.jpg");
            await copyFile("tests/test-content/jyvasjarvi.jpg", "deploy-tests/monitor-initial-files/jyvasjarvi.jpg");
            
            return laputin = await initializeLaputin("monitor-initial-files");
        });
        
        after(() => {
            laputin.fileLibrary.close();
        });
        
        it("Initial files can be found", () => shouldContainFiles(laputin, [carFile, catsFile, landscapeFile]));
        
        it("When file is deleted from library path, it can no longer be found", async function () {
            fs.unlinkSync("deploy-tests/monitor-initial-files/cats.jpg");
            await waitForEvent(laputin.fileLibrary, "lost", 8000);
            return await shouldContainFiles(laputin, [carFile, landscapeFile]);
        });

        it("When a duplicate file is copied to library path, it is detected as duplicate", async function () {
            await copyFile("tests/test-content/car.jpg", "deploy-tests/monitor-initial-files/car-duplicate.jpg")
            await waitForEvent(laputin.fileLibrary, "found", 8000);

            var duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({
                "32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592":
                [carFile, duplicateCarFile]
            });
            
            // Note that Laputin returns newly copied duplicate version of car.
            // This is because newer versions of file with same hash are always
            // used to overwrite the previous path. 
            return await shouldContainFiles(laputin, [duplicateCarFile, landscapeFile]);
        });

        it("When a file is overwritten with exact same file to exact same path, it is not detected as duplicate", async function () {
            await copyFile("tests/test-content/jyvasjarvi.jpg", "deploy-tests/monitor-initial-files/jyvasjarvi.jpg");
            await waitForEvent(laputin.fileLibrary, "found", 8000);
            
            var duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({
                "32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592":
                [carFile, duplicateCarFile]
            });
            
            return await shouldContainFiles(laputin, [duplicateCarFile, landscapeFile]);
        });
    });

    function shouldContainFiles(laputin: Laputin, expectedFiles: File[]): request.Test {
        return request(laputin.app)
                .get("/files")
                .expect(200)
                .expect(expectedFiles);
    }
});

function waitForEvent(emitter: events.EventEmitter, eventName: string, timeoutMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        var errTimeout = setTimeout(function () {
            reject(new Error("Event " + eventName + " was not emitted"));
        }, timeoutMs);
        
        emitter.on(eventName, function() {
            clearTimeout(errTimeout);
            resolve();
        });
    });
}

async function initializeLaputin(path: string): Promise<Laputin> {
    var archivePath = "deploy-tests/" + path;
    
    if (!fs.existsSync(archivePath)) {
        fs.mkdirSync(archivePath);
    }

    var laputin = new Laputin(archivePath);
    laputin.initializeRoutes();
    await laputin.library.createTables();
    await laputin.loadFiles();
    
    return laputin;
} 

function copyFile(source: string, target: string): Promise<void> {
    return new Promise<void>(function(resolve, reject) {
        var rd = fs.createReadStream(source);
        rd.on('error', reject);
        var wr = fs.createWriteStream(target);
        wr.on('error', reject);
        wr.on('finish', resolve);
        rd.pipe(wr);
    });
}