var _ = require("underscore");

function Library() {
}

Library.prototype.filter = function (allTags, allFiles) {
    var availableTags = [];

    var selectedTags = _.filter(allTags, function (tag) { return tag.selected; });
    if (selectedTags.length == 0) {
        return { matchingFiles: allFiles,
            availableTags: allTags,
            selectedTags: selectedTags,
            someTagsSelected: false };
    }

    var tagsWithAnd = _.filter(allTags, function (tag) { return tag.andOperator; });
    var tagsWithOr = _.filter(allTags, function (tag) { return tag.orOperator; });
    var tagsWithNot = _.filter(allTags, function (tag) { return tag.notOperator; });

    var hashesOfSelectedVideos = [];
    _.each(allTags, function (tag) {
        if (tag.selected) {
            hashesOfSelectedVideos.push(_.map(tag.files, function (file) {
                return file.hash
            }));
        }
    });
    var foo = _.union.apply(_, hashesOfSelectedVideos);
    var matchingFiles = _.filter(allFiles, function (file) {
        return _.contains(foo, file.hash);
    });



    var tagNamesWithAnd = _.pluck(tagsWithAnd, "name");
    var tagNamesWithOr = _.pluck(tagsWithOr, "name");
    var tagNamesWithNot = _.pluck(tagsWithNot, "name");

    matchingFiles = _.filter(matchingFiles, function (file) {
        var tagNames = _.pluck(file.tags, "name");
        return _.intersection(tagNames, tagNamesWithAnd).length === tagNamesWithAnd.length
            && (tagNamesWithOr.length === 0 || _.intersection(tagNames, tagNamesWithOr).length > 0)
            && _.intersection(tagNames, tagNamesWithNot).length === 0;
    });




    if (matchingFiles.length !== 0) {
        var selectedFilesHashes = _.map(matchingFiles, function (file) {
            return file.hash;
        });
        var fullFileInformation = _.filter(allFiles, function (file) {
            return _.contains(selectedFilesHashes, file.hash);
        });
        var allTagsOfSelectedFiles = _.map(fullFileInformation, function (file) {
            return file.tags;
        });
        var union = _.union.apply(_, allTagsOfSelectedFiles);
        var tagNames = _.map(union, function (tag) {
            return tag.name;
        });
        var uniqueTagNames = _.uniq(tagNames);

        availableTags = _.filter(allTags, function (tag) {
            return _.contains(uniqueTagNames, tag.name)
                && !_.contains(selectedTags, tag);
        });
    } else {
        availableTags = [];
    }

    return { matchingFiles: matchingFiles,
             availableTags: availableTags,
             selectedTags: selectedTags,
             someTagsSelected: true };
};

module.exports = Library;