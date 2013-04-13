function LaputinAPI(http) {
    this.getTags = function (callbackSuccess) {
        http.get("/tags").success(callbackSuccess);
    };

    this.getFile = function (hash, callback) {
        http.get("/files/" + hash).
            success(function (data) { callback(null, data); }).
            error(function (data, status) { callback(new Error(status), null); });
    };

    this.getFiles = function (callbackSuccess) {
        http.get("/files").success(callbackSuccess);
    };

    this.openFile = function (file, callbackSuccess) {
        http.get("/files/" + file.hash + "/open").success(callbackSuccess);
    };

    this.openFiles = function (selectedFiles) {
        var selectedHashes = _.pluck(selectedFiles, "hash");
        http.post("/open/files/", { selectedHashes: selectedHashes });
    };

    this.openTags = function (selectedTags) {
        http.post("/open/tags/", { selectedTags: selectedTags });
    };

    this.linkTagToFile = function (tag, file) {
        http.post("files/" + file.hash + "/tags", { selectedTags: [tag] });
    };

    this.unlinkTagFromFile = function (tag, file) {
        http.delete("files/" + file.hash + "/tags/" + tag.id);
    };

    this.createNewTag = function (tagName, callbackSuccess) {
        http.post("/tags", { tagName: tagName }).success(callbackSuccess);
    };

    this.renameTag = function (tagId, tag, callbackSuccess) {
        http.put("/tags/" + tagId, { tag: tag }).success(callbackSuccess);
    };
}

module.exports = LaputinAPI;
