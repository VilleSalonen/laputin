var React = require("react");

var LaputinAPI = require("../utils/LaputinAPI");

var EditableTag = React.createClass({
    getInitialState: function () {
        return {
            name: "",
            mode: "read"
        }
    },

    edit: function () {
        this.setState({ mode: "edit" });
    },

    save: function (e) {
        e.preventDefault();
        LaputinAPI.updateTag({ id: this.props.tag.id, name: this.state.name });
        this.setState({ mode: "read" });
    },

    cancel: function () {
        this.setState({ mode: "read", name: "" });
    },

    _onChange: function (e) {
        this.setState({ name: e.target.value });
    },

    render: function() {
        if (this.state.mode === "edit") {
            return <form onSubmit={this.save}>
                <input type="text" className="tag-edit" onChange={this._onChange} value={this.state.name} />
                <input type="submit" value="Save" />
            </form>;
        }

        return <div><span onClick={this.edit}>{this.props.tag.name}</span></div>;
    }
});

module.exports = EditableTag;