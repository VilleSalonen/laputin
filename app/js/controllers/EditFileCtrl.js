/*global _ */

var _ = require("underscore");

function EditFileCtrl($scope, LaputinAPI) {
    $scope.tagName = "";

    $scope.localTagNames = _.difference(
        _.pluck($scope.tags, "name").sort(),
        _.pluck($scope.file.tags, "name")
    );

    $scope.open = function () {
        LaputinAPI.openFile($scope.file);
    };

    $scope.addTag = function (tag) {
        $scope.file.tags.push(tag);
        $scope.localTagNames = _.without($scope.localTagNames, tag.name);
        LaputinAPI.linkTagToFile(tag, $scope.file, function (err) {
            if (err) {
                var idx = $scope.file.tags.indexOf(tag);
                if (idx !== -1) {
                    $scope.file.tags.splice(idx, 1);
                }
                alert(err);
            }
        });
        $scope.availableTagQuery = "";
    };

    $scope.removeTag = function (tag) {
        var idx = $scope.file.tags.indexOf(tag);

        $scope.localTagNames.push(tag.name)
        $scope.localTagNames.sort();

        if (idx !== -1) {
            $scope.file.tags.splice(idx, 1);
            LaputinAPI.unlinkTagFromFile(tag, $scope.file);
        }
    };

    $scope.createNewTag = function () {
        LaputinAPI.createNewTag($scope.newTagName, function (tag) {
            $scope.tags.push(tag);
            $scope.newTagName = "";
            $scope.addTag(tag);
        });
    };

    $scope.addTagFromSearch = function () {
        var tag = _.find($scope.tags, function (tag) {
            return tag.name === $scope.tagName;
        });

        if (tag) {
            $scope.addTag(tag);
            $scope.tagName = "";
        }
    };

    $scope.tagSearchFn = function() {
        return $scope.localTagNames;
    };
}

module.exports = EditFileCtrl;
