/*global _ */

function SingleTagCtrl($scope, $routeParams, LaputinAPI) {
    $scope.availableTagQuery = "";
    $scope.editing = false;
    $scope.allTags = [];

    var tagId = parseInt($routeParams.tagId, 10);
    LaputinAPI.getTags(function (data) {
        $scope.tags = _.sortBy(data, function (tag) { return tag.name });
        $scope.tag = _.find(data, function (tag) {
            return tag.id === tagId;
        });
    });

    $scope.removeFile = function (file) {
        var idx = $scope.tag.files.indexOf(file);
        if (idx !== -1) {
            $scope.tag.files.splice(idx, 1);
            LaputinAPI.unlinkTagFromFile($scope.tag, file);
        }
    };

    $scope.open = function () {
        LaputinAPI.openFiles([$scope.tag.name]);
    };

    $scope.edit = function () {
        $scope.editing = true;
    };

    $scope.save = function () {
        $scope.editing = false;
        LaputinAPI.renameTag($scope.tag.id, $scope.tag);
    };

    $scope.checkFiles = function (event) {
        _.each($scope.tag.files, function (file) {
            file.checked = event.srcElement.checked;
        });
    };

    $scope.linkSelectedToTag = function (tag) {
        _.each($scope.tag.files, function (file) {
            if (file.checked) {
                LaputinAPI.linkTagToFile(tag, file);
            }
        });
    };

    $scope.tagNameMatches = function (tag) {
        return tag.name.toUpperCase().indexOf($scope.availableTagQuery.toUpperCase()) !== -1;
    };

    $scope.removeTagFromSelectedFiles = function () {
        _.each($scope.tag.files, function (file) {
            if (file.checked) {
                LaputinAPI.unlinkTagFromFile($scope.tag, file);
            }
        });
    };
}

module.exports = SingleTagCtrl;
