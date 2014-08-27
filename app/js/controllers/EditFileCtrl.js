'use strict';

/*global _ */

var _ = require("underscore");

function EditFileCtrl($scope, LaputinAPI) {
    $scope.changed = false;

    $scope.fileTagName = "";


    $scope.localTagNames = _.difference(
        _.pluck($scope.allTags, "name").sort(),
        _.pluck($scope.file.tags, "name")
    );

    $scope.open = function () {
        LaputinAPI.openFile($scope.file);
    };

    $scope.addTag = function (tag) {
        $scope.file.tags.push(tag);
        $scope.localTagNames = _.without($scope.localTagNames, tag.name);
        LaputinAPI.linkTagToFile({ id: tag.id }, $scope.file, function (err) {
            if (err) {
                var idx = $scope.file.tags.indexOf(tag);
                if (idx !== -1) {
                    $scope.file.tags.splice(idx, 1);
                }
                alert(err);
            }
        });
        $scope.availableTagQuery = "";

        $scope.changed = true;
    };

    $scope.removeTag = function (tag) {
        var idx = $scope.file.tags.indexOf(tag);

        $scope.localTagNames.push(tag.name)
        $scope.localTagNames.sort();

        if (idx !== -1) {
            $scope.file.tags.splice(idx, 1);
            LaputinAPI.unlinkTagFromFile(tag, $scope.file);
        }

        $scope.changed = true;
    };

    $scope.createNewTag = function () {
        LaputinAPI.createNewTag($scope.newTagName, function (tag) {
            $scope.allTags.push(tag);
            $scope.newTagName = "";
            $scope.addTag(tag);
        });
    };

    $scope.addTagFromSearch = function () {
        var tag = _.find($scope.allTags, function (tag) {
            return tag.name === $scope.fileTagName;
        });

        if (tag) {
            $scope.addTag(tag);
            $scope.fileTagName = "";
        }
    };

    $scope.fileTagSearchFn = function() {
        return $scope.localTagNames;
    };

    $scope.$on('$destroy', function() {
        if ($scope.changed) {
            $scope.$emit("fileTagAssociationsChanged");
        }
    });
}

module.exports = EditFileCtrl;
