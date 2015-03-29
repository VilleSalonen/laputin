var _ = require("underscore");

function AppCtrl($scope, LaputinAPI) {
    $scope.allTags = [];
    $scope.allFiles = [];

    LaputinAPI.getTags(function (tags) {
        $scope.allTags = _.sortBy(tags, function (tag) { return tag.name });

        LaputinAPI.getFiles(function (files) {
            $scope.allFiles = _.sortBy(files, function (file) { return file.path });

            LaputinAPI.getDuplicates(function (files) {
                $scope.duplicates = !_.isEmpty(files) ? files : null;
            });
        });
    });
}

module.exports = AppCtrl;