var should = require("should");

var filterTaggedFiles = require("../../../app/js/services/FileFilters/filterTaggedFiles.js");

describe('filterTaggedFiles', function() {
    it('no files should return input as is', function() {
        var tags = [{ name: "Foo", files: [] }]
        var files = [];

        var result = filterTaggedFiles(tags, files);

        result.should.eql({ matchingFiles: [],
                            availableTags: [{ name: "Foo", files: [] }] });
    });

    it('list containing tagged and untagged should return only tagged after filtering', function() {
        var tags = [{ name: "Foo", files: [] }]
        var files = [{ hash: "asdf", tags: [{ name: "Foo" }] },
                     { hash: "foobar", tags: [] }];

        var result = filterTaggedFiles(tags, files);

        result.should.eql({ matchingFiles: [{ hash: "asdf", tags: [{ name: "Foo" }] }],
                            availableTags: [{ name: "Foo", files: [] }] });
    });
});