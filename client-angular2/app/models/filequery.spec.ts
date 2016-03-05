import chai = require("chai");
var expect = chai.expect;

import {FileQuery} from "./filequery";
import {Tag} from "./tag";

describe("File Query", function() {
    it("Filename defaults to empty string", () => {
        var query = new FileQuery();
        expect(query.filename).to.be.empty;
    });

    it("Filename is cleared", () => {
        var query = new FileQuery();
        
        query.filename = "moses.jpg";
        query.clear();
        
        expect(query.filename).to.be.empty;
    });

    it("Status defaults to 'both'", () => {
        var query = new FileQuery();
        expect(query.status).to.eql("both");
    });
    
    it("Status is cleared", () => {
        var query = new FileQuery();
        
        query.status = "tagged";
        query.clear();
        
        expect(query.status).to.eql("both");
    });
    
    it("Added AND tag is found", () => {
        var query = new FileQuery();
        var tag = new Tag(23, "Funny", 0);
        
        query.andTag(tag);
        
        expect(query.andTags).to.eql([tag]);
    });

    it("Tags can be removed", () => {
        var query = new FileQuery();
        var funny = new Tag(23, "Funny", 0);
        var hilarious = new Tag(235, "Hilarious", 0);
        
        query.andTag(funny);
        query.andTag(hilarious);
        
        query.removeTag(funny);
        
        expect(query.andTags).to.eql([hilarious]);
    });

    it("AND tags are cleared", () => {
        var query = new FileQuery();
        var tag = new Tag(23, "Funny", 0);
        
        query.andTag(tag);
        query.clear();
        
        expect(query.andTags).to.eql([]);
    });
});