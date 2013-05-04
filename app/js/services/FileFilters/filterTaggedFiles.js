var _ = require("underscore");

function filterTaggedFiles(filteredTags, filteredFiles) {
    var taggedFiles = _.filter(filteredFiles, function (file) {
        return file.tags.length !== 0;
    });

    return { matchingFiles: taggedFiles,
        availableTags: filteredTags };
}

module.exports = filterTaggedFiles;
