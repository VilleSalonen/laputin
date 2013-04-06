/*global require, describe, beforeEach, it */

var assert = require("assert");
var FilesCtrl = require("../../app/js/controllers/FilesCtrl.js");
var should = require("should");

describe("FilesCtrl", function () {
    var $scope = undefined,
        api = undefined,
        ctrl = undefined;

    describe("default values", function () {
        beforeEach(function () {
            $scope = {};
            api = {
                getTags: function () {},
                getFiles: function () {}
            };

            ctrl = new FilesCtrl($scope, api);
        });

        it("tag query is empty", function () {
            $scope.availableTagQuery.should.be.empty;
        });

        it("selectedFiles is empty", function () {
            $scope.selectedFiles.should.be.empty;
        });
    });

    describe("tag methods", function () {
        beforeEach(function () {
            $scope = {};
            api = {
                getTags: function () {},
                getFiles: function () {}
            };

            ctrl = new FilesCtrl($scope, api);
        });
    });
});
