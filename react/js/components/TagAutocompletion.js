var _ = require("underscore");
var React = require("react");

var LaputinAPI = require("../utils/LaputinAPI");

var TagAutocompletion = React.createClass({
    getInitialState: function () {
        var self = this;

        var query = {};
        if (this.props.unassociated === "1") {
            query.unassociated = true;
        }

        LaputinAPI.getTags(query, function (tags) {
            self.setState({ tags: tags });
        });

        return {
            matchingTags: [],
            tags: [],
            userInput: "",
            selectedIndex: -1
        };
    },

    selectTag: function (tag) {
        this.props.callback(tag);
        this.setState({ matchingTags: [], userInput: "", selectedIndex: -1 });
    },

    _onChange: function (event) {
        this.setState({ userInput: event.target.value });
    },

    _onKeyDown: function (event) {
        switch (event.keyCode) {
            case 13: // Return
            case 14: // Enter
                event.preventDefault();

                var tag = _.find(this.state.tags, function (tag) {
                    return tag.name === event.target.value;
                });

                if (tag) {
                    this.selectTag(tag);
                }
                break;
        }
    },

    render: function() {
        var selectedIds = _.pluck(this.props.selectedTags, "id");
        var tags = _.filter(this.state.tags, function (tag) { return selectedIds.indexOf(tag.id) === -1; });

        return <div>
            <input className="form-control"
                   list="tagsList"
                   id="tagAutocomplete"
                   value={this.state.userInput}
                   onChange={this._onChange}
                   onKeyDown={this._onKeyDown}
                   type="text" />

            <datalist id="tagsList">
                {tags.map(function (tag) {
                    return <option value={tag.name} />
                })}
            </datalist>
        </div>;
    }
});

module.exports = TagAutocompletion;