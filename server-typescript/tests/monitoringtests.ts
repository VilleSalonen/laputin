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
            
            let file = new File("32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592",
                "deploy-tests\\monitor-adding-files\\car.jpg",
                "deploy-tests\\monitor-adding-files\\car.jpg",
                []);
            
            copyFile(
                "tests/test-content/car.jpg",
                "deploy-tests/monitor-adding-files/car.jpg")
            .then(() => {
                return waitForEvent(laputin.fileLibrary, "found", 8000)
            })
            .then(() => {
                request(laputin.app)
                    .get("/files")
                    .expect(200)
                    .expect([file])
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
            console.log("event received");
            clearTimeout(errTimeout);
            resolve();
        });
    });
}

function initializeLaputin(path: string): Promise<Laputin> {
    var archivePath = "deploy-tests/" + path;
    
    rimraf.sync(archivePath);
    fs.mkdirSync(archivePath);

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