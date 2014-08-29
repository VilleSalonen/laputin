/*global _ */

function SingleFileCtrl($scope) {
    $scope.tagName = "";
    $scope.editing = false;
    $scope.showCreatingNewTags = false;

    $scope.edit = function () {
        $scope.editing = true;
    };

    $scope.closeEditing = function () {
        $scope.editing = false;
    };

    $scope.toggleShowCreatingNewTags = function () {
        $scope.showCreatingNewTags = !$scope.showCreatingNewTags;
    };
}

module.exports = SingleFileCtrl;
