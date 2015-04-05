module.exports = {
    getFiles: function (query, callbackSuccess) {
        var params = [];
        if (query.filename) { params.push("filename=" + query.filename); }
        if (query.status) { params.push("status=" + query.status); }
        if (query.and) { params.push("and=" + _.pluck(query.and, "id").join(",")); }
        if (query.or) { params.push("or=" + _.pluck(query.or, "id").join(",")); }
        if (query.not) { params.push("not=" + _.pluck(query.not, "id").join(",")); }

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