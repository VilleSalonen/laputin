var sinon = require("sinon");
var should = require("should");
var sandboxed_module = require("sandboxed-module");

describe('VLC', function() {
    it('hello', function() {
        var mockFs = {
            writeFile: function (path, content, callback) {
                callback();
            }
        };

        var mock = sinon.mock(mockFs);
        mock.expects("writeFile").once();

        var VLC = sandboxed_module.require("../../src/vlc.js", {
            requires: { 'fs': mockFs }
        }).VLC;

        var vlc = new VLC("/some/path");
        vlc.open();

        mock.verify();
    });
});