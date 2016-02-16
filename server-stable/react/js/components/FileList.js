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
            files: [],
            loading: false
        }
    },

    reload: function (query) {
        var self = this;
        this.setState({ loading: true });
        LaputinAPI.getFiles(query, function (files) {
            self.setState({ files: files, loading: false });
        });
    },

    render: function() {
        var content = "";
        if (this.state.loading) {
            content = <p>Loading...</p>;
        } else {
            content = <Files files={this.state.files} />;
        }

        return <div>
            <Search callback={this.reload} />
            {content}
        </div>;
    }
});

module.exports = FileList;
