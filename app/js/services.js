(function (angular) {
    'use strict';

    function LaputinAPI(http) {
        this.getTags = function (callbackSuccess) {
            http.get("/tags").success(callbackSuccess);
        };

        this.getFiles = function (callbackSuccess) {
            http.get("/files").success(callbackSuccess);
        };

        this.openFile = function (file, callbackSuccess) {
            http.get("/files/" + file.hash + "/open").success(callbackSuccess);
        };

        this.openFiles = function (selectedTags) {
            http.post("/open/tags/", { selectedTags: selectedTags });
        };

        this.linkTagToFile = function (tag, file) {
            http.post("files/" + file.hash + "/tags", { selectedTags: [tag] });
        };
    }

    angular.module('laputin.services', [], function ($provide) {
        $provide.factory('LaputinAPI', ['$http', function ($http) {
            return new LaputinAPI($http);
        }]);

        $provide.factory('LaputinAPI', ['$http', function ($http) {
            return new LaputinAPI($http);
        }]);
    });
})(angular);

