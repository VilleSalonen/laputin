/*global _ */

function FilesCtrl($scope, LaputinAPI) {
    $scope.availableTagQuery = "";
    $scope.selectedFiles = [];
    $scope.someTagsSelected = false;
    $scope.advancedTagFiltering = false;

    var allTags = [];
    var allFiles = [];

    LaputinAPI.getTags(function (data) {
        var tagsFromAPI = [];
        _.each(data, function (tag) {
            tag.andOperator = false;
            tag.orOperator = false;
            tag.notOperator = false;
            tag.selected = false;
            tagsFromAPI.push(tag);
        });
        allTags = tagsFromAPI;
        $scope.tags = allTags;
    });

    LaputinAPI.getFiles(function (data) {
        allFiles = _.sortBy(data, function (file) { return file.path });
        $scope.selectedFiles = allFiles;
    });

    $scope.openFiles = function () {
        var selectedTags = [];
        _.each(allTags, function (tag) {
            if (tag.selected) {
                selectedTags.push(tag.name);
            }
        });

        LaputinAPI.openTags(selectedTags);
    };

    $scope.toggleSelection = function (tag) {
        tag.selected = !tag.selected;
        if (tag.selected) {
            tag.andOperator = true;
        }

        var hashesOfSelectedVideos = [];

        if (_.any(allTags, function () { return tag.selected; })) {
            _.each(allTags, function (tag) {
                if (tag.selected) {
                    hashesOfSelectedVideos.push(_.map(tag.files, function (file) {
                        return file.hash
                    }));
                }
            });
            var intersection = _.intersection.apply(_, hashesOfSelectedVideos);
            $scope.selectedFiles = _.filter(allFiles, function (file) {
                return _.contains(intersection, file.hash);
            });

            if ($scope.selectedFiles.length !== 0) {
                var selectedFilesHashes = _.map($scope.selectedFiles, function (file) {
                    return file.hash;
                });
                var fullFileInformation = _.filter(allFiles, function (file) {
                    return _.contains(selectedFilesHashes, file.hash);
                });
                var allTagsOfSelectedFiles = _.map(fullFileInformation, function (file) {
                    return file.tags;
                });
                var union = _.union.apply(_, allTagsOfSelectedFiles);
                var tagNames = _.map(union, function (tag) {
                    return tag.name;
                });
                var uniqueTagNames = _.uniq(tagNames);

                $scope.tags = _.filter(allTags, function (tag) {
                    return _.contains(uniqueTagNames, tag.name);
                });
                $scope.someTagsSelected = true;
            } else {
                $scope.tags = allTags;
            }
        } else {
            $scope.someTagsSelected = false;
            $scope.selectedFiles = allFiles;
            $scope.tags = allTags;
        }
    };

    $scope.removeTagSelections = function () {
        _.each(allTags, function (tag) {
            tag.selected = false;
        });
        $scope.someTagsSelected = false;
        $scope.selectedFiles = allFiles;
        $scope.tags = allTags;
    };

    $scope.isTagSelected = function (tag) {
        return tag.selected;
    };

    $scope.isTagUnselected = function (tag) {
        return !tag.selected;
    };

    $scope.tagNameMatches = function (tag) {
        return tag.name.toUpperCase().indexOf($scope.availableTagQuery.toUpperCase()) !== -1;
    };

    $scope.activateAnd = function (tag) {
        tag.andOperator = true;
        tag.orOperator = false;
        tag.notOperator = false;
    };

    $scope.activateOr = function (tag) {
        tag.andOperator = false;
        tag.orOperator = true;
        tag.notOperator = false;
    };

    $scope.activateNot = function (tag) {
        tag.andOperator = false;
        tag.orOperator = false;
        tag.notOperator = true;
    };
}

module.exports = FilesCtrl;