/*global require */
'use strict';

var LaputinAPI = require("./services/LaputinAPI.js");
var Library = require("./services/Library.js");

var angular = require('./shims/angular.shim.js');
angular.module('laputin.services', [], function ($provide) {
    $provide.factory('LaputinAPI', ['$http', function ($http) {
        return new LaputinAPI($http);
    }]);

    $provide.factory('Library', [function ($http) {
        return new Library();
    }]);
});
