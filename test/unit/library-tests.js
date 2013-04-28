var Library = require("../../app/js/services/Library.js");
var should = require("should");

describe('Library', function() {
    var library = new Library();

    describe('tag filtering', function () {
        it('empty tag list should not have matching files or available tags', function() {
            var result = library.filter([], []);

            result.should.eql({ matchingFiles: [], availableTags: [], selectedTags: [], someTagsSelected: false });
        });

        it('no selected tags should return all tags', function() {
            var tags = [{ selected: false }];
            var files = [{ hash: "123" }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: files, availableTags: tags, selectedTags: [], someTagsSelected: false });
        });

        it('selected tag but no matching file should return no tags or files', function() {
            var tags = [{ selected: true, files: [{ hash: "456" }] }];
            var files = [{ hash: "123" }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: [], availableTags: [], selectedTags: [{ selected: true, files: [{ hash: "456" }] }], someTagsSelected: true });
        });

        it('selected tag and matching file', function() {
            var tags = [
                { name: "Some tag", selected: false, files: [{ hash: "123" }] },
                { name: "Matching tag", selected: true, files: [{ hash: "456" }] },
                { name: "Available tag", selected: false, files: [{ hash: "456" }]}];
            var files = [
                { hash: "123", tags: [{ name: "Some tag" }] },
                { hash: "456", tags: [{ name: "Matching tag" }, { name: "Available tag"}] }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: [{ hash: "456", tags: [{ name: "Matching tag" }, { name: "Available tag"}] }],
                                availableTags: [{ name: "Available tag", selected: false, files: [{ hash: "456" }]}],
                                selectedTags: [{ name: "Matching tag", selected: true, files: [{ hash: "456" }] }],
                                someTagsSelected: true });
        });
    });
});