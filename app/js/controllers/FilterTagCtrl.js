function FilterTagCtrl($scope) {
    $scope.activateAnd = function () {
        $scope.tag.andOperator = true;
        $scope.tag.orOperator = false;
        $scope.tag.notOperator = false;
        emitChange();
    };

    $scope.activateOr = function () {
        $scope.tag.andOperator = false;
        $scope.tag.orOperator = true;
        $scope.tag.notOperator = false;
        emitChange();
    };

    $scope.activateNot = function () {
        $scope.tag.andOperator = false;
        $scope.tag.orOperator = false;
        $scope.tag.notOperator = true;
        emitChange();
    };

    function emitChange() {
        $scope.$emit("advancedFilterChange");
    }
}

module.exports = FilterTagCtrl;
