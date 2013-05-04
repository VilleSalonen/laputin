var should = require("should");

var filterFileName = require("../../../app/js/services/FileFilters/filterFileName.js");

describe('filterFileName', function() {
    it('no files should return input as is', function() {
        var tags = [{ name: "Foo", files: [] }]
        var files = [];
        var options = {};

        var result = filterFileName(tags, files, options);

        result.should.eql({ matchingFiles: [],
                            availableTags: [{ name: "Foo", files: [] }] });
    });

    it('no options should return input as is', function() {
        var tags = [{ name: "Foo", files: [] }]
        var files = [{ path: "Test file" }];

        var result = filterFileName(tags, files, undefined);

        result.should.eql({ matchingFiles: [{ path: "Test file" }],
                            availableTags: [{ name: "Foo", files: [] }] });
    });

    it('given file name query should return only files which name match', function() {
        var tags = [{ name: "Foo", files: [] }]
        var files = [{ path: "Expected test file" },
                     { path: "Other test file"}];
        var options = { fileNameMatches: "Expected" };

        var result = filterFileName(tags, files, options);

        result.should.eql({ matchingFiles: [{ path: "Expected test file" }],
                            availableTags: [{ name: "Foo", files: [] }] });
    });

    it('given empty query should return input as is', function() {
        var tags = [{ name: "Foo", files: [] }]
        var files = [{ path: "Expected test file" },
                     { path: "Other test file"}];
        var options = { fileNameMatches: "" };

        var result = filterFileName(tags, files, options);

        result.should.eql({ matchingFiles: [{ path: "Expected test file" },
                                            { path: "Other test file" }],
                            availableTags: [{ name: "Foo", files: [] }] });
    });
});