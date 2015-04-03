module.exports = {
    getFiles: function (callbackSuccess) {
        fetch("/files2")
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