/*global require, describe, beforeEach, it */

var assert = require("assert");
var should = require("should");
var sinon = require("sinon");

var EditFileCtrl = require("../../app/js/controllers/EditFileCtrl.js");

describe("EditFileCtrl", function () {
    var $scope = {
            file: { hash: "asdf" },
            tags: [{ name: "First tag" }, { name: "Second tag" }]
        },
        api = {
            openFile: function (file) { }
        },
        ctrl = new EditFileCtrl($scope, api);

    describe("default values", function () {
        it("tagName should be empty", function () {
            $scope.tagName.should.be.empty;
        });

        it("localTagNames should contain copy of tag names", function () {
            $scope.localTagNames.should.eql(["First tag", "Second tag"]);
        });
    });

    describe("opening file should call API", function () {
        var spy = sinon.spy();
        api.openFile = spy;

        $scope.open();

        assert(spy.withArgs({ hash: "asdf" }).calledOnce);
    });
});
