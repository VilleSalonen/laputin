/*global _ */

function FilesCtrl($scope, LaputinAPI, Library) {
    var previouslySelectedTagNames = JSON.parse(localStorage.getItem("selectedTagNames"));

    $scope.searchOptions = {
        showAdvancedSearch: false,
        selectedTaggedStatus: 1
    };

    var previousSearchOptions = localStorage.getItem("previousSearchOptions");
    if (previousSearchOptions !== null) {
        _.extend($scope.searchOptions, JSON.parse(previousSearchOptions));
    }

    $scope.$watch("searchOptions", function () {
        localStorage.setItem("previousSearchOptions", JSON.stringify($scope.searchOptions));
    }, true);

    $scope.$watch("searchOptions.selectedTaggedStatus", function () {
        $scope.updateFilteredFiles();
    }, true);

    $scope.fileQuery = localStorage.getItem("fileQuery");
    $scope.selectedFiles = [];
    $scope.someTagsSelected = false;
    $scope.showAllTags = false;
    $scope.onlyUntagged = false;
    $scope.onlyTagged = false;
    $scope.showBatchOperations = false;

    $scope.toggleAdvancedSearch = function () {
        $scope.searchOptions.showAdvancedSearch = !$scope.searchOptions.showAdvancedSearch;
    };


    $scope.taggedStatuses = [
        {TypeId: 1, TypeName: "Tagged or untagged"},
        {TypeId: 2, TypeName: "Tagged"},
        {TypeId: 3, TypeName: "Untagged"}
    ];

    $scope.$on("fileTagAssociationsChanged", function () {
        $scope.updateFilteredFiles();
    });


    $scope.allTags = [];
    var allFiles = [];

    $scope.loadingTags = true;
    LaputinAPI.getTags(function (data) {
        var tagsFromAPI = [];
        _.each(data, function (tag) {
            if (_.contains(previouslySelectedTagNames, tag.name)) {
                tag.operator = "AND";
            } else {
                tag.operator = "";
            }

            tagsFromAPI.push(tag);
        });
        $scope.allTags = tagsFromAPI;
        $scope.tags = $scope.allTags;
        $scope.loadingTags = false;
    });

    $scope.loadingFiles = true;
    LaputinAPI.getFiles(function (data) {
        allFiles = _.sortBy(data, function (file) { return file.path });
        _.each(allFiles, function (file) {
            file.batchSelection = false;
        });

        $scope.selectedFiles = allFiles;
        $scope.loadingFiles = false;

        $scope.updateFilteredFiles();
    });

    $scope.openFiles = function () {
        LaputinAPI.openFiles($scope.selectedFiles);
    };

    $scope.toggleSelection = function (tag) {
        if (tag.operator === "") {
            tag.operator = "AND";
        }
        else
            tag.operator = "";

        $scope.updateFilteredFiles();
    };

    $scope.updateFilteredFiles = function () {
        var options = { fileNameMatches: $scope.fileQuery };

        var result = undefined;
        switch ($scope.searchOptions.selectedTaggedStatus) {
            case 1:
                result = Library.filter($scope.allTags, allFiles, options);
                break;
            case 2:
                result = Library.filterUntagged($scope.allTags, allFiles, options);
                break;
            case 3:
                result = Library.filterTagged($scope.allTags, allFiles, options);
                break;
        }

        $scope.selectedFiles = result.matchingFiles;
        $scope.visibleFiles = _.first($scope.selectedFiles, 100);

        if ($scope.showAllTags) {
            $scope.tags = $scope.allTags;
        } else {
            $scope.tags = result.availableTags;
        }

        $scope.selectedTags = _.filter($scope.allTags, function (tag) {
            return typeof tag.operator !== "undefined" && tag.operator !== "";
        });
        if (_.size($scope.selectedTags) === 0) {
            $scope.availableTags = $scope.allTags;
        } else {
            $scope.availableTags = _.filter($scope.tags, function (tag) { return tag.operator === ""; });
        }

        $scope.someTagsSelected = $scope.selectedTags.length > 0;

        localStorage.setItem("fileQuery", $scope.fileQuery);

        var selectedTagNames = _.pluck($scope.selectedTags, "name");
        localStorage.setItem("selectedTagNames", JSON.stringify(selectedTagNames));
    };

    $scope.clearSearchFilters = function () {
        _.each($scope.allTags, function (tag) {
            tag.operator = "";
        });

        $scope.showAllTags = false;
        $scope.onlyUntagged = false;
        $scope.onlyTagged = false;
        $scope.fileQuery = "";

        $scope.updateFilteredFiles();
    };

    $scope.isTagSelected = function (tag) {
        return tag.operator !== "";
    };

    $scope.isTagUnselected = function (tag) {
        return tag.operator === "";
    };

    $scope.fileNameMatches = function (file) {
        return file.path.toUpperCase().indexOf($scope.fileQuery.toUpperCase()) !== -1;
    };



    $scope.addTagFromSearch = function () {
        var tag = _.find($scope.tags, function (tag) {
            return tag.name === $scope.tagName;
        });

        if (tag) {
            $scope.toggleSelection(tag);
            $scope.tagName = "";
        }
    };


    $scope.tagName = "";
    $scope.tagSearchFn = function() {
        return $.map($scope.availableTags, function(candidate) {
            return candidate.name;
        });
    };


    $scope.batchTagName = "";
    $scope.batchAddTag = function () {
        var tag = _.find($scope.tags, function (tag) {
            return tag.name === $scope.batchTagName;
        });

        _.each($scope.selectedFiles, function (file) {
            if (file.batchSelection) {
                if (_.isEmpty(_.findWhere(file.tags, { "name": tag.name }))) {
                    file.tags.push(tag);
                    LaputinAPI.linkTagToFile(tag, file);
                }
            }
        });
    };

    $scope.batchCreateAndAddTag = function () {
        var tag = _.find($scope.tags, function (tag) {
            return tag.name === $scope.batchTagName;
        });

        // Make sure there isn't one yet.
        if (!tag) {
            LaputinAPI.createNewTag($scope.batchTagName, function (tag) {
                $scope.tags.push(tag);
                $scope.batchAddTag();
            });
        }
    };

    $scope.batchRemoveTag = function () {
        var tag = _.find($scope.tags, function (tag) {
            return tag.name === $scope.batchTagName;
        });

        var callbacks = [];

        var finalizing = function () {
            $scope.updateFilteredFiles();
        };
        callbacks.push(finalizing);

        _.each($scope.selectedFiles, function (file) {
            if (file.batchSelection) {
                if (_.size(_.findWhere(file.tags, { "name": tag.name })) > 0) {
                    var cb = _.last(callbacks);

                    callbacks.push(function () {
                        LaputinAPI.unlinkTagFromFile(tag, file, function () {
                            var idx = file.tags.indexOf(tag);
                            file.tags.splice(idx, 1);
                            if (typeof cb === "function")
                                cb();
                        });
                    });
                }
            }
        });

        var lastCallback = _.last(callbacks);
        lastCallback();
    };

    $scope.allInBatch = false;
    $scope.addSelectedToBatch = function () {
        _.each($scope.selectedFiles, function (file) {
            file.batchSelection = $scope.allInBatch;
        });
    };

    $scope.showMore = function () {
        var currentlyVisible = _.size($scope.visibleFiles);
        $scope.visibleFiles = _.union($scope.visibleFiles, $scope.selectedFiles.slice(currentlyVisible, currentlyVisible + 50));
    };
}

module.exports = FilesCtrl;