var FileTagList = require("./FileTagList");

var File = React.createClass({
    getInitialState: function () {
        return {
            "mode": "read"
        }
    },
    edit: function () {
        this.setState({ "mode": "edit" });
    },
    cancel: function () {
        this.setState({ "mode": "read" });
    },
    render: function() {
        if (this.state.mode === "edit"){
            return <p>Edit <a onClick={this.cancel}>Cancel</a></p>
        }

        return <div>
            <a onClick={this.edit}>{this.props.file.name}</a>
            <FileTagList tags={this.props.file.tags} />
        </div>;
    }
});



module.exports = File;