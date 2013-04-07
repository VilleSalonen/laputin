function AppCtrl($scope, $location, LaputinAPI) {
    $scope.goToFiles = function () {
        $location.path("/");
    };

    $scope.goToTags = function () {
        $location.path("/tags");
    };

    $scope.goToUntagged = function () {
        $location.path("/untagged");
    };

    $scope.focusSearch = function () {
        $(".search-query").focus();
    };

    $scope.typeahead = [];
    var allTags = [];
    var allFiles = [];
    LaputinAPI.getTags(function (tags) {
        $scope.typeahead = [];
        allTags = tags;
        _.each(tags, function (tag) {
            tag.type = "Tag";
            $scope.typeahead.push(tag);
        });

        LaputinAPI.getFiles(function (files) {
            allFiles = files;
            _.each(files, function (file) {
                file.type = "File";
                $scope.typeahead.push(file);
            });
        });
    });

    $scope.typeaheadValue = "";
    $scope.typeaheadFn = function(query) {
        return $.map($scope.typeahead, function(candidate) {
            if (candidate.type === "File") {
                return "File: " + candidate.name;
            } else {
                return "Tag: " + candidate.name;
            }
        });
    };

    $scope.goToSearchResult = function () {
        if ($scope.typeaheadValue.indexOf("File: ") === 0) {
            var name = $scope.typeaheadValue.replace("File: ", "");
            var matchingFile = _.find(allFiles, function (file) {
                return file.name === name;
            });

            if (matchingFile) {
                $scope.typeaheadValue = "";
                $(".search-query").blur();
                $location.path("/files/" + matchingFile.hash);
            }
        } else {
            var name = $scope.typeaheadValue.replace("Tag: ", "");
            var matchingTag = _.find(allTags, function (tag) {
                return tag.name === name;
            });

            if (matchingTag) {
                $scope.typeaheadValue = "";
                $(".search-query").blur();
                $location.path("/tags/" + matchingTag.id);
            }
        }
    };
}

module.exports = AppCtrl;