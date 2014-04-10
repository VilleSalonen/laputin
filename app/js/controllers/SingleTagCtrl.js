/*global _ */

function SingleTagCtrl($scope, $routeParams, LaputinAPI) {
    $scope.editing = false;
    $scope.newName = "";

    $scope.edit = function () {
        $scope.editing = true;
        $scope.newName = $scope.tag.name;
    };

    $scope.save = function () {
        $scope.editing = false;
        $scope.tag.name = $scope.newName;
        $scope.newName = "";
        LaputinAPI.renameTag($scope.tag.id, $scope.tag);
    };
    
    $scope.cancel = function () {
        $scope.editing = false;
    }
}

module.exports = SingleTagCtrl;
