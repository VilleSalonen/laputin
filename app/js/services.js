/*global require */
'use strict';

var LaputinAPI = require("./services/LaputinAPI.js");

var angular = require('./../lib/angular.shim.js')
angular.module('laputin.services', [], function ($provide) {
    $provide.factory('LaputinAPI', ['$http', function ($http) {
        return new LaputinAPI($http);
    }]);
});
