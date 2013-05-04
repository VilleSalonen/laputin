var _ = require("underscore");

var filterBasedOnTagSelection = require("./FileFilters/filterBasedOnTagSelection.js");
var filterUntaggedFiles = require("./FileFilters/filterUntaggedFiles.js");

function Library() {
}

Library.prototype.filter = function (filteredTags, filteredFiles) {
    return filterBasedOnTagSelection(filteredTags, filteredFiles);
};

Library.prototype.filterUntagged = function (filteredTags, filteredFiles) {
    return filterUntaggedFiles(filteredTags, filteredFiles);
};

module.exports = Library;