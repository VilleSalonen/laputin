/*global _ */

function TagsCtrl($scope, LaputinAPI) {
    $scope.availableTagQuery = "";

    var allTags = [];

    LaputinAPI.getTags(function (data) {
        var tagsFromAPI = [];
        _.each(data, function (tag) {
            tag.selected = false;
            tagsFromAPI.push(tag);
            console.log(tag.name + " " + tag.files.length);
        });
        allTags = tagsFromAPI;
        $scope.tags = allTags;
    });

    $scope.tagNameMatches = function (tag) {
        return tag.name.toUpperCase().indexOf($scope.availableTagQuery.toUpperCase()) !== -1;
    };
}

module.exports = TagsCtrl;
