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
            var tags = [{ selected: false, andOperator: false, orOperator: false, notOperator: false }];
            var files = [{ hash: "123" }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: files, availableTags: tags, selectedTags: [], someTagsSelected: false });
        });


        it('selected tag but no matching file should return no tags or files', function() {
            var tags = [{ name: "Some tag", selected: true, andOperator: true, orOperator: false, notOperator: false, files: [] }];
            var files = [{ hash: "123" }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: [],
                                availableTags: [],
                                selectedTags: [{ name: "Some tag", selected: true, andOperator: true, orOperator: false, notOperator: false, files: [] }],
                                someTagsSelected: true });
        });


        it('selected tag and matching file', function() {
            var tags = [
                { name: "Some tag", selected: false, andOperator: false, orOperator: false, notOperator: false, files: [{ hash: "123" }] },
                { name: "Matching tag", selected: true, andOperator: true, orOperator: false, notOperator: false, files: [{ hash: "456" }] },
                { name: "Available tag", selected: false, andOperator: false, orOperator: false, notOperator: false, files: [{ hash: "456" }]}];
            var files = [
                { hash: "123", tags: [{ name: "Some tag" }] },
                { hash: "456", tags: [{ name: "Matching tag" }, { name: "Available tag"}] }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: [{ hash: "456", tags: [{ name: "Matching tag" }, { name: "Available tag"}] }],
                                availableTags: [{ name: "Available tag", selected: false, andOperator: false, orOperator: false, notOperator: false, files: [{ hash: "456" }]}],
                                selectedTags: [{ name: "Matching tag", selected: true, andOperator: true, orOperator: false, notOperator: false, files: [{ hash: "456" }] }],
                                someTagsSelected: true });
        });


        it('selected AND tags should only match files with all tags', function() {
            var tags = [
                { name: "Common", selected: true, andOperator: true, orOperator: false, notOperator: false,
                    files: [{ hash: "123" }, { hash: "456" }] }];
            var files = [
                { hash: "123", tags: [{ name: "Common" }] },
                { hash: "456", tags: [{ name: "Common" }] },
                { hash: "789", tags: [{ name: "Another tag" }] }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: [{ hash: "123", tags: [{ name: "Common" }] }, { hash: "456", tags: [{ name: "Common" }] }],
                availableTags: [],
                selectedTags: [{ name: "Common", selected: true, andOperator: true, orOperator: false, notOperator: false, files: [{ hash: "123" }, { hash: "456" }] }],
                someTagsSelected: true });
        });


        it('selected OR tags should only match files with any of the tags', function() {
            var tags = [
                { name: "One", selected: true, andOperator: false, orOperator: true, notOperator: false, files: [{ hash: "123" }] },
                { name: "Other", selected: true, andOperator: false, orOperator: true, notOperator: false, files: [{ hash: "456" }] }];
            var files = [
                { hash: "123", tags: [{ name: "One" }] },
                { hash: "456", tags: [{ name: "Other" }] },
                { hash: "789", tags: [{ name: "Non-matching tag" }] }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: [{ hash: "123", tags: [{ name: "One" }] }, { hash: "456", tags: [{ name: "Other" }] }],
                availableTags: [],
                selectedTags: [{ name: "One", selected: true, andOperator: false, orOperator: true, notOperator: false, files: [{ hash: "123" }] },
                    { name: "Other", selected: true, andOperator: false, orOperator: true, notOperator: false, files: [{ hash: "456" }] }],
                someTagsSelected: true });
        });


        it('files with specified NOT tags should not be matched', function() {
            var tags = [
                { name: "Wanted", selected: true, andOperator: true, orOperator: false, notOperator: false, files: [{ hash: "123" }, { hash: "456" }] },
                { name: "Not wanted", selected: true, andOperator: false, orOperator: false, notOperator: true, files: [{ hash: "456" }] }];
            var files = [
                { hash: "123", tags: [{ name: "Wanted" }] },
                { hash: "456", tags: [{ name: "Wanted" }, { name: "Not wanted" }] }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: [{ hash: "123", tags: [{ name: "Wanted" }] }],
                availableTags: [],
                selectedTags: [{ name: "Wanted", selected: true, andOperator: true, orOperator: false, notOperator: false, files: [{ hash: "123" }, { hash: "456" }] },
                    { name: "Not wanted", selected: true, andOperator: false, orOperator: false, notOperator: true, files: [{ hash: "456" }] }],
                someTagsSelected: true });
        });


        it('files with unselected tags should be included when searching with NOT operators', function() {
            var tags = [
                { name: "Unselected", selected: false, andOperator: false, orOperator: false, notOperator: false, files: [{ hash: "123" }] },
                { name: "Not wanted", selected: true, andOperator: false, orOperator: false, notOperator: true, files: [{ hash: "456" }] }];
            var files = [
                { hash: "123", tags: [{ name: "Unselected" }] },
                { hash: "456", tags: [{ name: "Wanted" }, { name: "Not wanted" }] }];

            var result = library.filter(tags, files);

            result.should.eql({ matchingFiles: [{ hash: "123", tags: [{ name: "Unselected" }] }],
                availableTags: [{ name: "Unselected", selected: false, andOperator: false, orOperator: false, notOperator: false, files: [{ hash: "123" }] }],
                selectedTags: [{ name: "Not wanted", selected: true, andOperator: false, orOperator: false, notOperator: true, files: [{ hash: "456" }] }],
                someTagsSelected: true });
        });

    });
});