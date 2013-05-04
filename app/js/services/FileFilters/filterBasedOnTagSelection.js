var _ = require("underscore");

function filterBasedOnTagSelection(filteredTags, filteredFiles) {
    if (filteredTags.length === 0) {
        return { matchingFiles: filteredFiles,
                 availableTags: filteredTags };
    }

    var tagNamesWithAnd = _.pluck(_.filter(filteredTags, function (tag) { return tag.operator === "AND"; }), "name");
    var tagNamesWithOr = _.pluck(_.filter(filteredTags, function (tag) { return tag.operator === "OR"; }), "name");
    var tagNamesWithNot = _.pluck(_.filter(filteredTags, function (tag) { return tag.operator === "NOT"; }), "name");

    var matchingFiles = _.filter(filteredFiles, function (file) {
        return fileMatchesOperators(file, tagNamesWithAnd, tagNamesWithOr, tagNamesWithNot);
    });

    return { matchingFiles: matchingFiles,
             availableTags: getAvailableTagsOfMatchingFiles(matchingFiles, filteredTags) };
}

function fileMatchesOperators(file, tagNamesWithAnd, tagNamesWithOr, tagNamesWithNot) {
    var tagNames = _.pluck(file.tags, "name");
    return fileContainsAllAndOperators(tagNames, tagNamesWithAnd)
        && fileContainsAtLeastOneOrOperator(tagNames, tagNamesWithOr)
        && fileContainsNoNotOperators(tagNames, tagNamesWithNot);
}

function fileContainsAllAndOperators(tagNames, tagNamesWithAnd) {
    return _.intersection(tagNames, tagNamesWithAnd).length === tagNamesWithAnd.length;
}

function fileContainsAtLeastOneOrOperator (tagNames, tagNamesWithOr) {
    return tagNamesWithOr.length === 0
        || _.intersection(tagNames, tagNamesWithOr).length > 0;
}

function fileContainsNoNotOperators(tagNames, tagNamesWithNot) {
    return _.intersection(tagNames, tagNamesWithNot).length === 0
}

function getAvailableTagsOfMatchingFiles(matchingFiles, allTags) {
    if (matchingFiles.length === 0)
        return [];

    var allTagsOfMatchingFiles = _.pluck(matchingFiles, "tags");
    var union = _.union.apply(_, allTagsOfMatchingFiles);
    var unique = _.uniq(union);
    var tagNames = _.pluck(unique, "name");

    return _.filter(allTags, function (tag) {
        return tag.operator === ""
            && _.contains(tagNames, tag.name);
    });
}

module.exports = filterBasedOnTagSelection;