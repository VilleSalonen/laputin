var _ = require("underscore");

module.exports = {
    getFiles: function (query, callbackSuccess) {
        var params = [];
        if (query.filename) { params.push("filename=" + query.filename); }
        if (query.status) { params.push("status=" + query.status); }

        var and = _.where(query.selectedTags, { mode: "AND" });
        var or = _.where(query.selectedTags, { mode: "OR" });
        var not = _.where(query.selectedTags, { mode: "NOT" });

        if (and && and.length > 0) { params.push("and=" + _.pluck(and, "id").join(",")); }
        if (or && or.length > 0) { params.push("or=" + _.pluck(or, "id").join(",")); }
        if (not && not.length > 0) { params.push("not=" + _.pluck(not, "id").join(",")); }

        var url = "/files";
        if (params.length > 0) {
            url += "?" + params.join("&");
        }

        fetch(url)
            .then(function (response) {
                return response.json();
            })
            .then(function (json) {
                callbackSuccess(json);
            })
            .catch(function (ex) {
                console.log('fetching files failed: ', ex);
            });
    },

    getTags: function (query, callbackSuccess) {
        var params = [];

        if (query.unassociated) {
            params.push("unassociated=1");
        }

        var url = "/tags";
        if (params.length > 0) {
            url += "?" + params.join("&");
        }

        fetch(url)
            .then(function (response) {
                return response.json();
            })
            .then(function (json) {
                callbackSuccess(json);
            })
            .catch(function (ex) {
                console.log('fetching tags failed: ', ex);
            });
    },

    addTag: function (file, tag, callbackSuccess) {
        fetch("/files/" + file.hash + "/tags", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                selectedTags: [tag]
            })
        }).then(callbackSuccess);
    },

    deleteTagFileAssoc: function (file, tag, callbackSuccess) {
        fetch("/files/" + file.hash + "/tags/" + tag.id, {
            method: "DELETE"
        }).then(callbackSuccess);
    },

    openFiles: function (selectedFiles, callbackSuccess) {
        var selectedHashes = _.pluck(selectedFiles, "hash");
        fetch("/open/files/", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                selectedHashes: selectedHashes
            })
        }).then(callbackSuccess);
    },

    openFile: function (selectedFile, callbackSuccess) {
        var url = "/files/" + selectedFile.hash + "/open";
        fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(callbackSuccess);
    },

    createTag: function (tagName, callbackSuccess) {
        function status(response) {
            if (response.status >= 200 && response.status < 300) {
                return Promise.resolve(response)
            } else {
                return Promise.reject(new Error(response.statusText))
            }
        }

        function json(response) {
            return response.json()
        }

        fetch("/tags", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tagName: tagName
            })
        }).then(status)
          .then(json)
          .then(callbackSuccess);
    },

    getDuplicates: function (callbackSuccess) {
        var url = "/duplicates";

        fetch(url)
            .then(function (response) {
                return response.json();
            })
            .then(function (json) {
                callbackSuccess(json);
            })
            .catch(function (ex) {
                console.log('fetching duplicates failed: ', ex);
            });
    }
};