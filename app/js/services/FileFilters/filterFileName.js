var _ = require("underscore");

function filterFileName(filteredTags, filteredFiles, filterOptions) {
    if (
           typeof filterOptions === "undefined"
        || typeof filterOptions.fileNameMatches === "undefined"
        || filterOptions.fileNameMatches === "")
        return { matchingFiles: filteredFiles,
                 availableTags: filteredTags };

    var matchingFiles = _.filter(filteredFiles, function (file) {
        return file.path.toUpperCase().indexOf(filterOptions.fileNameMatches.toUpperCase()) !== -1;
    });

    return { matchingFiles: matchingFiles,
             availableTags: filteredTags };
}

module.exports = filterFileName;
