/*global require */

var AppCtrl = require("./controllers/AppCtrl.js");
var FilesCtrl = require("./controllers/FilesCtrl.js");
var SingleFileCtrl = require("./controllers/SingleFileCtrl.js");
var TagsCtrl = require("./controllers/TagsCtrl.js");
var SingleTagCtrl = require("./controllers/SingleTagCtrl.js");
var UntaggedFilesCtrl = require("./controllers/UntaggedFilesCtrl.js");

var angular = require('./shims/angular.shim.js');
angular.module("laputin.controllers", []).controller("AppCtrl", ["$scope", "$location", "LaputinAPI", AppCtrl])
                                         .controller("FilesCtrl", ["$scope", "LaputinAPI", FilesCtrl])
                                         .controller("SingleFileCtrl", ["$scope", "$routeParams", "LaputinAPI", SingleFileCtrl])
                                         .controller("TagsCtrl", ["$scope", "LaputinAPI", TagsCtrl])
                                         .controller("SingleTagCtrl", ["$scope", "$routeParams", "LaputinAPI", SingleTagCtrl])
                                         .controller("UntaggedFilesCtrl", ["$scope", "LaputinAPI", UntaggedFilesCtrl]);
