'use strict';

describe('directives', function() {
    beforeEach(module('laputin.directives'));

    describe('fileTagListing', function() {
        it('should list tags from file', function() {
            inject(function($compile, $rootScope) {
                var $scope = $rootScope.$new();

                var element = $compile('<file-tag-listing></file-tag-listing>')($scope);

                $scope.$apply(function () {
                    $scope.file = { tags: [{ name: "Foo" }, { name: "Bar" }] };
                });

                expect(element.text()).toEqual('Bar, Foo');
            });
        });
    });
});
