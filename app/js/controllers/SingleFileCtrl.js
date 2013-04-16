/*global _ */

function SingleFileCtrl($scope, $routeParams, LaputinAPI) {
    $scope.availableTagQuery = "";
    $scope.file = undefined;
    $scope.tags = [];
    $scope.newTagName = "";
    $scope.fileNotFound = false;

    var allTags = [];

    function refresh() {
        LaputinAPI.getFile($routeParams.fileId, function (err, file) {
            if (err && err.message === "404") {
                $scope.fileNotFound = true;
                return;
            }

            $scope.file = file;

            LaputinAPI.getTags(function (data) {
                var tagsFromAPI = [];
                _.each(data, function (tag) {
                    tag.focused = false;
                    tag.selected = false;
                    tagsFromAPI.push(tag);
                });

                allTags = tagsFromAPI;
                updateTagList();
            });
        });
    }

    refresh();

    $scope.addTag = function (tag) {
        $scope.file.tags.push(tag);
        updateTagList();
        LaputinAPI.linkTagToFile(tag, $scope.file, function (err) {
            if (err) {
                var idx = $scope.file.tags.indexOf(tag);
                if (idx !== -1) {
                    $scope.file.tags.splice(idx, 1);
                }
                updateTagList();
                alert(err);
            }
        });
        $scope.availableTagQuery = "";
    };

    $scope.removeTag = function (tag) {
        var idx = $scope.file.tags.indexOf(tag);
        if (idx !== -1) {
            $scope.file.tags.splice(idx, 1);
            LaputinAPI.unlinkTagFromFile(tag, $scope.file);
            updateTagList();
        }
    };

    $scope.createNewTag = function () {
        LaputinAPI.createNewTag($scope.newTagName, function (tag) {
            $scope.newTagName = "";
            $scope.addTag(tag);
        });
    };

    function updateTagList() {
        var tagNames = _.pluck($scope.file.tags, 'name');
        $scope.tags = _.filter(allTags, function (tag) {
            return !_.contains(tagNames, tag.name);
        });
    }

    $scope.tagNameMatches = function (tag) {
        if (typeof tag !== 'undefined')
            return tag.name.toUpperCase().indexOf($scope.availableTagQuery.toUpperCase()) !== -1;
        return false;
    };

    $scope.openFile = function (file) {
        LaputinAPI.openFile(file, function () {
            console.log("Opened file " + file);
        });
    };

    $scope.addTagIfOnlyOneLeft = function () {
        var tagsLeft = _.filter($scope.tags, $scope.tagNameMatches);
        if (_.size(tagsLeft) === 1) {
            var tag = tagsLeft[0];
            $scope.file.tags.push(tag);
            updateTagList();
            LaputinAPI.linkTagToFile(tag, $scope.file);
            $scope.availableTagQuery = "";
        }
    };
}

module.exports = SingleFileCtrl;
