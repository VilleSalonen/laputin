/*global _ */

function SingleFileCtrl($scope) {
    $scope.tagName = "";
    $scope.editing = false;

    $scope.edit = function () {
        $scope.editing = true;
    };

    $scope.closeEditing = function () {
        $scope.editing = false;
    };
}

module.exports = SingleFileCtrl;
