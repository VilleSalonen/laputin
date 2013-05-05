/*global _ */

function FilesCtrl($scope, LaputinAPI, Library) {
    var previouslySelectedTagNames = JSON.parse(localStorage.getItem("selectedTagNames"));

    $scope.fileQuery = localStorage.getItem("fileQuery");
    $scope.selectedFiles = [];
    $scope.someTagsSelected = false;
    $scope.advancedTagFiltering = false;
    $scope.showAllTags = false;
    $scope.onlyUntagged = false;
    $scope.onlyTagged = false;
    $scope.showTagInfoForFiles = true;




    $scope.taggedStatuses = [
        {TypeId: 1, TypeName: "Tagged or untagged"},
        {TypeId: 2, TypeName: "Tagged"},
        {TypeId: 3, TypeName: "Untagged"}
    ];
    $scope.selectedTaggedStatus = 1;


    $scope.$on("advancedFilterChange", function () {
        $scope.updateFilteredFiles();
    });


    var allTags = [];
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
        allTags = tagsFromAPI;
        $scope.tags = allTags;
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
        if ($scope.onlyUntagged) {
            result = Library.filterUntagged(allTags, allFiles, options);
        } else {
            if ($scope.onlyTagged) {
                result = Library.filterTagged(allTags, allFiles, options);
            } else {
                result = Library.filter(allTags, allFiles, options);
            }
        }

        $scope.selectedFiles = result.matchingFiles;
        if ($scope.showAllTags) {
            $scope.tags = result.availableTags;
        } else {
            $scope.tags = allTags;
        }

        $scope.selectedTags = _.filter(allTags, function (tag) { return tag.operator !== ""; });
        $scope.someTagsSelected = $scope.selectedTags.length > 0;

        localStorage.setItem("fileQuery", $scope.fileQuery);

        var selectedTagNames = _.pluck($scope.selectedTags, "name");
        localStorage.setItem("selectedTagNames", JSON.stringify(selectedTagNames));
    };

    $scope.$watch("onlyUntagged", function () {
        if ($scope.onlyUntagged) {
            $scope.onlyTagged = false;
        }
    });

    $scope.$watch("onlyTagged", function () {
        if ($scope.onlyTagged) {
            $scope.onlyUntagged = false;
        }
    });

    $scope.clearSearchFilters = function () {
        _.each(allTags, function (tag) {
            tag.operator = "";
        });

        $scope.advancedTagFiltering = false;
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
        return $.map($scope.tags, function(candidate) {
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
}

module.exports = FilesCtrl;