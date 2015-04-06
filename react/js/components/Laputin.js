var React = require("react");

var Header = require("./Header.js");
var Search = require("./Search.js");
var Files = require("./Files.js");
var LaputinAPI = require("../utils/LaputinAPI");

var Laputin = React.createClass({
    getInitialState: function () {
        this.reload({});

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
            <Header />
            <Search callback={this.reload} />
            <Files files={this.state.files} />
        </div>;
    }
});

module.exports = Laputin;