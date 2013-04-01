'use strict';

/* Filters */

angular.module('laputin.filters', []).
  filter('stringSort', [function() {
    return function(input) {
        if (typeof input !== 'undefined')
            return input.sort();
    }
}]);