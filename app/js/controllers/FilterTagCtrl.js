function FilterTagCtrl($scope) {
    $scope.activateAnd = function () {
        $scope.tag.andOperator = true;
        $scope.tag.orOperator = false;
        $scope.tag.notOperator = false;
    };

    $scope.activateOr = function () {
        $scope.tag.andOperator = false;
        $scope.tag.orOperator = true;
        $scope.tag.notOperator = false;
    };

    $scope.activateNot = function () {
        $scope.tag.andOperator = false;
        $scope.tag.orOperator = false;
        $scope.tag.notOperator = true;
    };
}

module.exports = FilterTagCtrl;
