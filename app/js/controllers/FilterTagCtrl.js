function FilterTagCtrl($scope) {
    $scope.andOperatorOn = function () { return $scope.tag.operator === "AND"; };
    $scope.andOperatorOff = function () { return $scope.tag.operator === "AND"; };

    $scope.orOperatorOn = function () { return $scope.tag.operator === "OR"; };
    $scope.orOperatorOff = function () { return $scope.tag.operator === "OR"; };

    $scope.notOperatorOn = function () { return $scope.tag.operator === "NOT"; };
    $scope.notOperatorOff = function () { return $scope.tag.operator === "NOT"; };

    $scope.activateAnd = function () {
        $scope.tag.operator = "AND";
        emitChange();
    };

    $scope.activateOr = function () {
        $scope.tag.operator = "OR";
        emitChange();
    };

    $scope.activateNot = function () {
        $scope.tag.operator = "NOT";
        emitChange();
    };

    function emitChange() {
        $scope.$emit("advancedFilterChange");
    }
}

module.exports = FilterTagCtrl;
