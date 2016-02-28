/// <reference path="../typings/main.d.ts" />

import chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;

import fs = require("fs");
import rimraf = require("rimraf");
import request = require("supertest");

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
        
        it("No files can be found", function () {
            return request(laputin.app)
                .get("/files")
                .expect(200)
                .expect([]);
        });
        
        it("When file is copied to library path, it can be found", function (done) {
            this.timeout(10000);
            
            let file = new File("32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592",
                "deploy-tests\\monitor-adding-files\\car.jpg", "deploy-tests\\monitor-adding-files\\car.jpg", []);
            
            copyFile(
                "tests\\test-content\\car.jpg",
                "deploy-tests\\monitor-adding-files\\car.jpg")
            .then(() => {
                var errTimeout = setTimeout(function () {
                    assert.fail("File found was not emitted");
                    done();
                }, 10000);

                laputin.fileLibrary.on('found', function() {
                    clearTimeout(errTimeout); //cancel error timeout
                    
                    request(laputin.app)
                        .get("/files")
                        .expect(200)
                        .expect([file], done);
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
    laputin.initializeRoutes();
    return laputin.library.createTables()
        .then(() => laputin.loadFiles())
        .then(() => {
            return laputin;
        });
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