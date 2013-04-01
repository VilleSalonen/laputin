var Library = require("../../src/library.js").Library;
var should = require("should");

describe('Library', function() {
    var library = new Library('/some/path');

    it('adding tag should work', function() {
        var tag = { id: 1, name: "Funny" };
        library.addTag(tag);

        var tags = library.getTags();
        tags[tag.id].should.equal(tag);
    });

    it('adding a file should work', function () {
        var file = { hash: '470daf9b351812975e5dcbe525344075', path: '/Users/tester/Movies/funny.mov' };
        library.addFile(file);

        var files = library.getFiles();
        files[file.hash].should.equal(file);
    });

    it('linking a tag to a file should work', function () {
        var tag = { id: 1, name: "Funny" };
        var file = { hash: '470daf9b351812975e5dcbe525344075', path: '/Users/tester/Movies/funny.mov' };

        library.addTag(tag);
        library.addFile(file);

        library._linkTagToFile(tag, file);

        tag.files.length.should.equal(1);
        tag.files[0].hash.should.equal(file.hash);

        file.tags.length.should.equal(1);
        file.tags[0].id.should.equal(tag.id);
    });
});