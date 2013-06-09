'use strict';

describe('SingleFileCtrl', function () {
    beforeEach(module('laputin.controllers'));

    it('should ...', inject(function($rootScope, $controller) {
        var $scope = $rootScope.$new();
        var ctrl = $controller('SingleFileCtrl', {
            $scope : $scope
        });

        expect($scope.editing).toEqual(false);
    }));

    it('should ...', inject(function($rootScope, $controller) {
        var $scope = $rootScope.$new();
        var ctrl = $controller('SingleFileCtrl', {
            $scope : $scope
        });

        $scope.edit();
        expect($scope.editing).toEqual(true);
    }));

    it('should ...', inject(function($rootScope, $controller) {
        var $scope = $rootScope.$new();
        var ctrl = $controller('SingleFileCtrl', {
            $scope : $scope
        });

        $scope.edit();
        $scope.closeEditing();
        expect($scope.editing).toEqual(false);
    }));
});
