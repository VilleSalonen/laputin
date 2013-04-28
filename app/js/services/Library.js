var _ = require("underscore");

function Library() {
}

Library.prototype.filter = function (allTags, allFiles) {
    var self = this;

    var selectedTags = _.filter(allTags, function (tag) { return tag.selected; });
    if (selectedTags.length == 0) {
        return { matchingFiles: allFiles,
            availableTags: allTags,
            selectedTags: [],
            someTagsSelected: false };
    }

    var tagNamesWithAnd = _.pluck(_.filter(allTags, function (tag) { return tag.operator === "AND"; }), "name");
    var tagNamesWithOr = _.pluck(_.filter(allTags, function (tag) { return tag.operator === "OR"; }), "name");
    var tagNamesWithNot = _.pluck(_.filter(allTags, function (tag) { return tag.operator === "NOT"; }), "name");

    var matchingFiles = _.filter(allFiles, function (file) {
        return self.fileMatchesOperators(file, tagNamesWithAnd, tagNamesWithOr, tagNamesWithNot);
    });

    return { matchingFiles: matchingFiles,
             availableTags: this.getAvailableTagsOfMatchingFiles(matchingFiles, allTags),
             selectedTags: selectedTags,
             someTagsSelected: true };
};

Library.prototype.fileMatchesOperators = function (file, tagNamesWithAnd, tagNamesWithOr, tagNamesWithNot) {
    var tagNames = _.pluck(file.tags, "name");
    return this.fileContainsAllAndOperators(tagNames, tagNamesWithAnd)
        && this.fileContainsAtLeastOneOrOperator(tagNames, tagNamesWithOr)
        && this.fileContainsNoNotOperators(tagNames, tagNamesWithNot);
};

Library.prototype.fileContainsAllAndOperators = function (tagNames, tagNamesWithAnd) {
    return _.intersection(tagNames, tagNamesWithAnd).length === tagNamesWithAnd.length;
};

Library.prototype.fileContainsAtLeastOneOrOperator = function (tagNames, tagNamesWithOr) {
    return tagNamesWithOr.length === 0
        || _.intersection(tagNames, tagNamesWithOr).length > 0;
};

Library.prototype.fileContainsNoNotOperators = function (tagNames, tagNamesWithNot) {
    return _.intersection(tagNames, tagNamesWithNot).length === 0
};

Library.prototype.getAvailableTagsOfMatchingFiles = function (matchingFiles, allTags) {
    if (matchingFiles.length === 0)
        return [];

    var allTagsOfMatchingFiles = _.pluck(matchingFiles, "tags");
    var union = _.union.apply(_, allTagsOfMatchingFiles);
    var unique = _.uniq(union);
    var tagNames = _.pluck(unique, "name");

    return _.filter(allTags, function (tag) {
        return tag.selected == false
            && _.contains(tagNames, tag.name);
    });
};

module.exports = Library;