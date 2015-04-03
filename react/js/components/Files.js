var FilesSummary = require("./FilesSummary");
var FileList = require("./FileList");

var Files = React.createClass({
    render: function () {
        return <div>
            <FilesSummary items={this.props.files} />
            <FileList items={this.props.files} />
        </div>;
    }
});

module.exports = Files;