var _ = require("underscore");

var filterBasedOnTagSelection = require("FileFilters/filterBasedOnTagSelection.js");

function Library() {
}

Library.prototype.filter = function (filteredTags, filteredFiles) {
    return filterBasedOnTagSelection(filteredTags, filteredFiles);
};

module.exports = Library;