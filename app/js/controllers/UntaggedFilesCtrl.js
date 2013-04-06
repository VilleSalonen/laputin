function UntaggedFilesCtrl($scope, LaputinAPI) {
    $scope.untaggedFiles = [];

    LaputinAPI.getFiles(function (data) {
        $scope.untaggedFiles = _.filter(data, function (file) {
            return file.tags.length === 0;
        });
    });
}

module.exports = UntaggedFilesCtrl;
