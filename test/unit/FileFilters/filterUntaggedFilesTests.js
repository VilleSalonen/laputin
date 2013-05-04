var should = require("should");

var filterUntaggedFiles = require("../../../app/js/services/FileFilters/filterUntaggedFiles.js");

describe('filterUntaggedFiles', function() {
    it('no files should return input as is', function() {
        var tags = [{ name: "Foo", files: [] }]
        var files = [];

        var result = filterUntaggedFiles(tags, files);

        result.should.eql({ matchingFiles: [],
                            availableTags: [{ name: "Foo", files: [] }] });
    });

    it('list containing tagged and untagged should return only untagged after filtering', function() {
        var tags = [{ name: "Foo", files: [] }]
        var files = [{ hash: "asdf", tags: [{ name: "Foo" }] },
                     { hash: "foobar", tags: [] }];

        var result = filterUntaggedFiles(tags, files);

        result.should.eql({ matchingFiles: [{ hash: "foobar", tags: [] }],
                            availableTags: [{ name: "Foo", files: [] }] });
    });
});