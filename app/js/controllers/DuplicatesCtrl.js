/*global _ */

function DuplicatesCtrl($scope, LaputinAPI) {
    LaputinAPI.getDuplicates(function (duplicates) {
        $scope.duplicates = duplicates;
    });
}

module.exports = DuplicatesCtrl;
