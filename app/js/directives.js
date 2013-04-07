'use strict';

/* Directives */


angular.module('laputin.directives', []).
    directive('onEnter', [function () {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function(){
                        scope.$eval(attrs.onEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    }]).
    directive('wKeydown', function() {
        return function(scope, elm, attr) {
            elm.bind('keydown', function(e) {
                // We don't want to trigger keyboard shortcut when user types
                // in inputs.
                if (e.target !== $("body")[0])
                    return;

                switch (e.keyCode) {
                    case 70:
                        return scope.$apply(attr.wFKey);
                    case 84:
                        return scope.$apply(attr.wTKey);
                    case 85:
                        return scope.$apply(attr.wUKey);
                }
            });
        };
    }).
    // Source: https://github.com/mgcrea/angular-strap/blob/master/src/directives/navbar.js
    directive('bsNavbar', ['$location', function($location) {
        'use strict';

        return {
            restrict: 'A',
            link: function postLink($scope, element, attrs, controller) {
                // Watch for the $location
                $scope.$watch(function() {
                    return $location.path();
                }, function(newValue, oldValue) {
                    $('li[data-match-route]', element).each(function(k, li) {
                        var $li = angular.element(li),
                            pattern = $li.attr('data-match-route'),
                            regexp = new RegExp('^' + pattern + '$', ["i"]);

                        if(regexp.test(newValue)) {
                            $li.addClass('active');
                        } else {
                            $li.removeClass('active');
                        }
                    });
                });
            }
        };
    }]);
