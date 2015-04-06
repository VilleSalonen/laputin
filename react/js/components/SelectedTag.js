var React = require("react");
var ReactBootstrap = require("react-bootstrap");

var DropdownButton = ReactBootstrap.DropdownButton;
var MenuItem = ReactBootstrap.MenuItem;

var SelectedTag = React.createClass({
    getInitialState: function () {
        return {
            "mode": "AND"
        }
    },

    mustContain: function () { this.setState({ "mode": "AND" }); this.props.tag.mode = "AND"; this.props.reloadCallback(); },
    canContain: function () { this.setState({ "mode": "OR" }); this.props.tag.mode = "OR"; this.props.reloadCallback(); },
    doesNotContain: function () { this.setState({ "mode": "NOT" }); this.props.tag.mode = "NOT"; this.props.reloadCallback(); },

    remove: function () {
        this.props.removeCallback(this.props.tag);
    },

    getBsStyle: function () {
        switch (this.state.mode) {
            case "AND": return "success"; break;
            case "OR": return "info"; break;
            case "NOT": return "danger"; break;
            default:
                console.log("Unknown mode: " + this.state.mode);
        }
    },

    render: function() {
        return <DropdownButton bsStyle={this.getBsStyle()} title={this.props.tag.name}>
            <MenuItem onClick={this.mustContain}>Must contain</MenuItem>
            <MenuItem onClick={this.canContain}>Can contain</MenuItem>
            <MenuItem onClick={this.doesNotContain}>Does not contain</MenuItem>
            <MenuItem divider />
            <MenuItem onClick={this.remove}>Remove</MenuItem>
        </DropdownButton>;
    }
});

module.exports = SelectedTag;