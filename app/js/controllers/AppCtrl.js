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

    $scope.focusSearch = function () {
        $(".search-query").focus();
    }
}

module.exports = AppCtrl;