(function (angular) {
    'use strict';

    function LaputinAPI(http) {
        this.getTags = function (callbackSuccess) {
            http.get("/tags").success(callbackSuccess);
        };

        this.getFiles = function (callbackSuccess) {
            http.get("/files").success(callbackSuccess);
        };

        this.openFiles = function (selectedTags) {
            http.post("/open/tags/", { selectedTags: selectedTags });
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

