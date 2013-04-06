'use strict';

require("./controllers.js");
require("./services.js");
require("./filters.js");
require("./directives.js");

// Declare app level module which depends on filters, and services
angular.module('laputin', ['laputin.filters', 'laputin.services', 'laputin.directives', 'laputin.controllers']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'partials/files.html', controller: "FilesCtrl"});
    $routeProvider.when('/files/:fileId', {templateUrl: 'partials/single_file.html', controller: "SingleFileCtrl"});
    $routeProvider.when('/tags/', {templateUrl: 'partials/tags.html', controller: "TagsCtrl"});
    $routeProvider.when('/tags/:tagId', {templateUrl: 'partials/single_tag.html', controller: "SingleTagCtrl"});
    $routeProvider.when('/untagged/', {templateUrl: 'partials/untagged.html', controller: "UntaggedFilesCtrl"});
    $routeProvider.otherwise({redirectTo: '/'});
  }]);
