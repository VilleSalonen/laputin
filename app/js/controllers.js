/*global require */

var AppCtrl = require("./controllers/AppCtrl.js");
var FilesCtrl = require("./controllers/FilesCtrl.js");
var FilterTagCtrl = require("./controllers/FilterTagCtrl.js");
var SingleFileCtrl = require("./controllers/SingleFileCtrl.js");
var TagsCtrl = require("./controllers/TagsCtrl.js");
var SingleTagCtrl = require("./controllers/SingleTagCtrl.js");
var EditFileCtrl = require("./controllers/EditFileCtrl.js");

var angular = require('./shims/angular.shim.js');
angular.module("laputin.controllers", []).controller("AppCtrl", ["$scope", "$location", "LaputinAPI", AppCtrl])
                                         .controller("FilesCtrl", ["$scope", "LaputinAPI", "Library", FilesCtrl])
                                         .controller("FilterTagCtrl", FilterTagCtrl)
                                         .controller("SingleFileCtrl", ["$scope", "LaputinAPI", SingleFileCtrl])
                                         .controller("EditFileCtrl", ["$scope", "LaputinAPI", EditFileCtrl])
                                         .controller("TagsCtrl", ["$scope", "LaputinAPI", TagsCtrl])
                                         .controller("SingleTagCtrl", ["$scope", "$routeParams", "LaputinAPI", SingleTagCtrl]);
