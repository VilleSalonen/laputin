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

describe("File Library", () => {
    describe("No initial files in library path", () => {
        let carFile = new File("32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592",
            "deploy-tests\\monitor-adding-files\\car.jpg",
            "deploy-tests\\monitor-adding-files\\car.jpg",
            []);
        
        let laputin: Laputin;
        
        before(() => {
            return initializeLaputin("monitor-adding-files")
                .then((l) => { laputin = l; });
        });
        
        after(() => {
            laputin.fileLibrary.close();
        });
        
        it("No files can be found", function () {
            return request(laputin.app)
                .get("/files")
                .expect(200)
                .expect([]);
        });
        
        it("When file is copied to library path, it can be found", function (done) {
            this.timeout(10000);
            
            copyFile("tests/test-content/car.jpg", "deploy-tests/monitor-adding-files/car.jpg")
                .then(() => {
                    return waitForEvent(laputin.fileLibrary, "found", 8000)
                })
                .then(() => {
                    request(laputin.app)
                        .get("/files")
                        .expect(200)
                        .expect([carFile])
                        .end(() => {
                            done();
                        });
                })
                .catch((error) => {
                    done(error);
                });
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
        
        before(() => {
            fs.mkdirSync("deploy-tests/monitor-initial-files");
            return copyFile("tests/test-content/car.jpg", "deploy-tests/monitor-initial-files/car.jpg")
                .then(() => copyFile("tests/test-content/cats.jpg", "deploy-tests/monitor-initial-files/cats.jpg"))
                .then(() => copyFile("tests/test-content/jyvasjarvi.jpg", "deploy-tests/monitor-initial-files/jyvasjarvi.jpg"))
                .then(() => initializeLaputin("monitor-initial-files"))
                .then((l) => { laputin = l; });
        });
        
        after(() => {
            laputin.fileLibrary.close();
        });
        
        it("Initial files can be found", function () {
            return request(laputin.app)
                .get("/files")
                .expect(200)
                .expect([carFile, catsFile, landscapeFile]);
        });
        
        it("When file is deleted from library path, it can no longer be found", function (done) {
            this.timeout(10000);
            
            fs.unlinkSync("deploy-tests/monitor-initial-files/cats.jpg");
            return waitForEvent(laputin.fileLibrary, "lost", 8000)
                .then(() => {
                    request(laputin.app)
                        .get("/files")
                        .expect(200)
                        .expect([carFile, catsFile, landscapeFile])
                        .end(() => done());
                })
                .catch((error) => {
                    done(error);
                });
        });
        
        it("When a duplicate file is copied to library path, it is detected as duplicate", function (done) {
            this.timeout(10000);

            copyFile("tests/test-content/car.jpg", "deploy-tests/monitor-initial-files/car-duplicate.jpg")
                .then(() => {
                    return waitForEvent(laputin.fileLibrary, "found", 8000)
                })
                .then(() => {
                    var duplicates = laputin.fileLibrary.getDuplicates();
                    expect(duplicates).to.eql({
                        '32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592':
                        [
                            carFile,
                            new File("32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592",
                                "deploy-tests\\monitor-initial-files\\car-duplicate.jpg",
                                "deploy-tests\\monitor-initial-files\\car-duplicate.jpg",
                                [])
                        ]
                    });
                })
                .then(() => {
                    request(laputin.app)
                        .get("/files")
                        .expect(200)
                        .expect([carFile, landscapeFile])
                        .end(() => {
                            done();
                        });
                })
                .catch((error) => {
                    done(error);
                });
        });
    });
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

function initializeLaputin(path: string): Promise<Laputin> {
    var archivePath = "deploy-tests/" + path;
    
    if (!fs.existsSync(archivePath)) {
        fs.mkdirSync(archivePath);
    }

    var laputin = new Laputin(archivePath);
    laputin.initializeRoutes();
    return laputin.library.createTables()
        .then(() => laputin.loadFiles())
        .then(() => { return laputin; });
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