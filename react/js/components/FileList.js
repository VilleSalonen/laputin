var React = require("react");

var Header = require("./Header.js");
var Search = require("./Search.js");
var Files = require("./Files.js");
var LaputinAPI = require("../utils/LaputinAPI");

var FileList = React.createClass({
    getInitialState: function () {
        var stored = JSON.parse(localStorage.getItem("search"));
        if (stored) {
            this.reload(stored);
        } else {
            this.reload({});
        }

        return {
            files: []
        }
    },

    reload: function (query) {
        var self = this;
        LaputinAPI.getFiles(query, function (files) {
            self.setState({ files: files });
        });
    },

    render: function() {
        return <div>
            <Search callback={this.reload} />
            <Files files={this.state.files} />
        </div>;
    }
});

module.exports = FileList;
