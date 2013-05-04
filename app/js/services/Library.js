var _ = require("underscore");

var filterBasedOnTagSelection = require("./FileFilters/filterBasedOnTagSelection.js");
var filterTaggedFiles = require("./FileFilters/filterTaggedFiles.js");
var filterUntaggedFiles = require("./FileFilters/filterUntaggedFiles.js");
var filterFileName = require("./FileFilters/filterFileName.js");

function Library() {
}

Library.prototype.filter = function (filteredTags, filteredFiles, options) {
    var filters = [filterFileName, filterBasedOnTagSelection];
    return this._processFilters(filteredTags, filteredFiles, options, filters);
};

Library.prototype.filterTagged = function (filteredTags, filteredFiles, options) {
    var filters = [filterFileName, filterTaggedFiles, filterBasedOnTagSelection];
    return this._processFilters(filteredTags, filteredFiles, options, filters);
};

Library.prototype.filterUntagged = function (filteredTags, filteredFiles, options) {
    var filters = [filterFileName, filterUntaggedFiles];
    return this._processFilters(filteredTags, filteredFiles, options, filters);
};

Library.prototype._processFilters = function (filteredTags, filteredFiles, options, filters) {
    var result = { availableTags: filteredTags, matchingFiles: filteredFiles };
    for (var i = 0; i < filters.length; i++) {
        result = filters[i](result.availableTags, result.matchingFiles, options);
    }
    return result;
};


module.exports = Library;