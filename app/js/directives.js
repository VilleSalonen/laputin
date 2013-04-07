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
});