/*global _ */

function FilesCtrl($scope, LaputinAPI, Library) {
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
        tag.andOperator = false;
        tag.orOperator = false;
        tag.notOperator = false;

        tag.selected = !tag.selected;
        if (tag.selected) {
            tag.andOperator = true;
        }

        var result = Library.filter(allTags, allFiles);

        $scope.someTagsSelected = result.someTagsSelected;
        $scope.selectedFiles = result.matchingFiles;
        $scope.tags = result.availableTags;
        $scope.selectedTags = result.selectedTags;
    };

    $scope.$on("advancedFilterChange", function () {
        var result = Library.filter(allTags, allFiles);

        $scope.someTagsSelected = result.someTagsSelected;
        $scope.selectedFiles = result.matchingFiles;
        $scope.tags = result.availableTags;
        $scope.selectedTags = result.selectedTags;
    });

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
}

module.exports = FilesCtrl;