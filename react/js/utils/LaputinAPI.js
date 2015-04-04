module.exports = {
    getFiles: function (query, callbackSuccess) {
        var params = [];
        if (query.filename) { params.push("filename=" + query.filename); }
        if (query.status) { params.push("status=" + query.status); }

        var url = "/files2";
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

    getTags: function (callbackSuccess) {
        fetch("/tags2")
            .then(function (response) {
                return response.json();
            })
            .then(function (json) {
                callbackSuccess(json);
            })
            .catch(function (ex) {
                console.log('fetching tags failed: ', ex);
            });
    }
};