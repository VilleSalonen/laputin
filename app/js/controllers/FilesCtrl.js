/*global _ */

function FilesCtrl($scope, LaputinAPI, Library) {
    var previouslySelectedTagNames = JSON.parse(localStorage.getItem("selectedTagNames"));

    $scope.fileQuery = localStorage.getItem("fileQuery");
    $scope.selectedFiles = [];
    $scope.someTagsSelected = false;
    $scope.advancedTagFiltering = false;
    $scope.showAllTags = true;
    $scope.onlyUntagged = false;
    $scope.onlyTagged = false;

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

    $scope.removeTagSelections = function () {
        _.each(allTags, function (tag) {
            tag.operator = "";
        });
        $scope.someTagsSelected = false;
        $scope.selectedFiles = allFiles;
        $scope.tags = allTags;
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
}

module.exports = FilesCtrl;