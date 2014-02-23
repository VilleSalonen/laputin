/*global require */

'use strict';

require("./controllers.js");
require("./services.js");
require("./filters.js");
require("./directives.js");

// Declare app level module which depends on filters, and services
angular.module('laputin', ['laputin.filters', 'laputin.services', 'laputin.directives', 'laputin.controllers', 'infinite-scroll']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/files/', {templateUrl: 'partials/files.html', controller: "FilesCtrl"});
    $routeProvider.when('/tags/', {templateUrl: 'partials/tags.html', controller: "TagsCtrl"});
    $routeProvider.otherwise({redirectTo: '/files/'});
  }]);
