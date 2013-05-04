function AppCtrl($scope, $location, LaputinAPI) {
    $scope.lastSubmit = undefined;

    $scope.goToFiles = function () {
        $location.path("/");
    };

    $scope.goToTags = function () {
        $location.path("/tags");
    };

    $scope.focusSearch = function () {
        $(".search-query").focus();
    };

    $scope.typeahead = [];
    $scope.allTags = [];
    $scope.allFiles = [];
    LaputinAPI.getTags(function (tags) {
        $scope.typeahead = [];
        $scope.allTags = tags;
        _.each(tags, function (tag) {
            tag.type = "Tag";
            $scope.typeahead.push(tag);
        });

        LaputinAPI.getFiles(function (files) {
            $scope.allFiles = _.sortBy(files, function (file) { return file.path });;
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

    $scope.goToSearchResult = function (e) {
        if ($scope.typeaheadValue.indexOf("File: ") === 0) {
            var name = $scope.typeaheadValue.replace("File: ", "");
            var matchingFile = _.find($scope.allFiles, function (file) {
                return file.name === name;
            });

            if (matchingFile) {
                $scope.typeaheadValue = "";
                $scope.lastSubmit = new Date();
                $location.path("/files/" + matchingFile.hash);
            }
        } else {
            var name = $scope.typeaheadValue.replace("Tag: ", "");
            var matchingTag = _.find($scope.allTags, function (tag) {
                return tag.name === name;
            });

            if (matchingTag) {
                $scope.typeaheadValue = "";
                $scope.lastSubmit = new Date();
                $location.path("/tags/" + matchingTag.id);
            }
        }
    };
}

module.exports = AppCtrl;