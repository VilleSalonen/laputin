var _ = require("underscore");

function filterUntaggedFiles(filteredTags, filteredFiles) {
    var untaggedFiles = _.filter(filteredFiles, function (file) {
        return file.tags.length === 0;
    });

    return { matchingFiles: untaggedFiles,
             availableTags: filteredTags };
}

module.exports = filterUntaggedFiles;
