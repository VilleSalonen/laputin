/*global _ */

function SingleFileCtrl($scope, LaputinAPI) {
    $scope.editing = false;

    $scope.edit = function () {
        $scope.editing = true;
    };

    $scope.closeEditing = function () {
        $scope.editing = false;
    };

    $scope.open = function () {
        LaputinAPI.openFile($scope.file);
    };

    $scope.addTag = function (tag) {
        $scope.file.tags.push(tag);
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
        if (idx !== -1) {
            $scope.file.tags.splice(idx, 1);
            LaputinAPI.unlinkTagFromFile(tag, $scope.file);
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


    $scope.addTagFromSearch = function () {
        var tag = _.find($scope.tags, function (tag) {
            return tag.name === $scope.tagName;
        });

        if (tag) {
            $scope.addTag(tag);
            $scope.tagName = "";
        }
    };


    $scope.tagName = "";
    $scope.tagSearchFn = function() {
        return $.map($scope.tags, function(candidate) {
            return candidate.name;
        });
    };
};

module.exports = SingleFileCtrl;
