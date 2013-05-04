var _ = require("underscore");

var filterBasedOnTagSelection = require("./FileFilters/filterBasedOnTagSelection.js");
var filterTaggedFiles = require("./FileFilters/filterTaggedFiles.js");
var filterUntaggedFiles = require("./FileFilters/filterUntaggedFiles.js");

function Library() {
}

Library.prototype.filter = function (filteredTags, filteredFiles) {
    return filterBasedOnTagSelection(filteredTags, filteredFiles);
};

Library.prototype.filterTagged = function (filteredTags, filteredFiles) {
    var result = filterTaggedFiles(filteredTags, filteredFiles);
    return filterBasedOnTagSelection(result.availableTags, result.matchingFiles);
};

Library.prototype.filterUntagged = function (filteredTags, filteredFiles) {
    return filterUntaggedFiles(filteredTags, filteredFiles);
};

module.exports = Library;