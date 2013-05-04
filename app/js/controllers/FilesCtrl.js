/*global _ */

function FilesCtrl($scope, LaputinAPI, Library) {
    $scope.availableTagQuery = "";
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
            tag.operator = "";
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
    });

    $scope.openFiles = function () {
        LaputinAPI.openFiles($scope.selectedFiles);
    };

    $scope.toggleSelection = function (tag) {
        if (tag.operator === "") {
            tag.operator = "AND";
            $scope.availableTagQuery = "";
        }
        else
            tag.operator = "";

        updateFilteredFiles();
    };

    $scope.$on("advancedFilterChange", function () {
        updateFilteredFiles();
    });

    function updateFilteredFiles() {
        if ($scope.onlyUntagged) {
            var result = Library.filterUntagged(allTags, allFiles);
        } else {
            if ($scope.onlyTagged) {
                var result = Library.filterTagged(allTags, allFiles);
            } else {
                var result = Library.filter(allTags, allFiles);
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
    }

    $scope.$watch("showAllTags", function () {
        updateFilteredFiles();
    });

    $scope.$watch("onlyUntagged", function () {
        if ($scope.onlyUntagged) {
            $scope.onlyTagged = false;
        }

        updateFilteredFiles();
    });

    $scope.$watch("onlyTagged", function () {
        if ($scope.onlyTagged) {
            $scope.onlyUntagged = false;
        }

        updateFilteredFiles();
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

    $scope.tagNameMatches = function (tag) {
        return tag.name.toUpperCase().indexOf($scope.availableTagQuery.toUpperCase()) !== -1;
    };
}

module.exports = FilesCtrl;