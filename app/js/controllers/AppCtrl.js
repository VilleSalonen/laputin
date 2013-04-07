function AppCtrl($scope, $location) {
    $scope.goToFiles = function () {
        $location.path("/");
    };

    $scope.goToTags = function () {
        $location.path("/tags");
    };

    $scope.goToUntagged = function () {
        $location.path("/untagged");
    };
}

module.exports = AppCtrl;