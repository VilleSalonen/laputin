/*global _ */

function SingleTagCtrl($scope, $routeParams, LaputinAPI) {
    $scope.editing = false;

    $scope.edit = function () {
        $scope.editing = true;
    };

    $scope.save = function () {
        $scope.editing = false;
        LaputinAPI.renameTag($scope.tag.id, $scope.tag);
    };
}

module.exports = SingleTagCtrl;
