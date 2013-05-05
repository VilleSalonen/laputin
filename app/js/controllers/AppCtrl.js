function AppCtrl($scope, LaputinAPI) {
    $scope.allTags = [];
    $scope.allFiles = [];

    LaputinAPI.getTags(function (tags) {
        $scope.allTags = _.sortBy(tags, function (tag) { return tag.name });

        LaputinAPI.getFiles(function (files) {
            $scope.allFiles = _.sortBy(files, function (file) { return file.path });;
        });
    });
}

module.exports = AppCtrl;