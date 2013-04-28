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

    var tagNamesWithAnd = _.pluck(tagsWithAnd, "name");
    var tagNamesWithOr = _.pluck(tagsWithOr, "name");
    var tagNamesWithNot = _.pluck(tagsWithNot, "name");

    var matchingFiles = _.filter(allFiles, function (file) {
        var tagNames = _.pluck(file.tags, "name");
        return _.intersection(tagNames, tagNamesWithAnd).length === tagNamesWithAnd.length
            && (tagNamesWithOr.length === 0 || _.intersection(tagNames, tagNamesWithOr).length > 0)
            && _.intersection(tagNames, tagNamesWithNot).length === 0;
    });

    if (matchingFiles.length !== 0) {
        var allTagsOfMatchingFiles = _.pluck(matchingFiles, "tags");
        var union = _.union.apply(_, allTagsOfMatchingFiles);
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