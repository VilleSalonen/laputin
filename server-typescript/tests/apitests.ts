/// <reference path="../typings/mocha/mocha.d.ts" />

import request = require("supertest");

import {server} from "./../server";

describe("Laputin API", () => {
    it("files should be found", (done) => {
        request(server)
            .get("/files")
            .expect(200)
            .end((err, res) => {
                if (err) throw err;
                done();
            });
    });

    it("tags should be found", (done) => {
        request(server)
            .get("/tags")
            .expect(200)
            .end((err, res) => {
                if (err) throw err;
                done();
            });
    });
});
