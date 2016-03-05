import chai = require("chai");
var expect = chai.expect;

import {FileQuery} from "./filequery";

describe("File Query", function() {
    it("Filename defaults to empty string", () => {
        var query = new FileQuery();
        expect(query.filename).to.be.empty;
    });

    it("Status defaults to 'both'", () => {
        var query = new FileQuery();
        expect(query.status).to.eql("both");
    });
});