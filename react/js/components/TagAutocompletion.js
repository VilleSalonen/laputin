var _ = require("underscore");
var React = require("react");

var LaputinAPI = require("../utils/LaputinAPI");

var TagAutocompletion = React.createClass({
    _keyEvents: {
        38: "UP",
        40: "DOWN",
        13: "RETURN",
        14: "ENTER",
        27: "ESC"
    },

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

    handleChange: function (event) {
        var input = event.target.value;
        var matching = _.chain(this.state.tags)
                        .filter(function (tag) {
                            return tag.name.toLowerCase().indexOf(input.toLowerCase()) !== -1;
                        })
                        .difference(this.props.selectedTags)
                        // Prefer tags which have matching tags earlier.
                        .sortBy(function (tag) {
                            return tag.name.toLowerCase().indexOf(input.toLowerCase());
                        })
                        .value();

        this.setState({ userInput: event.target.value, matchingTags: matching });
    },

    _onKeyDown: function (event) {
        var key = this._keyEvents[event.keyCode];
        if (typeof key !== "undefined") {
            switch (key) {
                case "UP":
                    event.preventDefault();
                    if (this.state.selectedIndex === -1) {
                        // can't go higher
                        return;
                    }

                    this.setState({ selectedIndex: this.state.selectedIndex - 1 });
                    break;
                case "DOWN":
                    event.preventDefault();
                    if (this.state.selectedIndex === this.state.matchingTags.length - 1) {
                        // can't go lower
                        return;
                    }

                    this.setState({ selectedIndex: this.state.selectedIndex + 1 });
                    break;
                case "ENTER":
                case "RETURN":
                    event.preventDefault();
                    if (this.state.selectedIndex === -1) {
                        // can't select nothing
                        return;
                    }

                    this.selectTag(this.state.matchingTags[this.state.selectedIndex]);
                    break;
                case "ESC":
                    event.preventDefault();
                    event.target.blur();
                    this.setState({ matchingTags: [], userInput: "", selectedIndex: -1 });
            }
        }
    },

    selectTag: function (tag) {
        this.props.callback(tag);
        this.setState({ matchingTags: [], userInput: "", selectedIndex: -1 });
    },

    _onChange: function (event) {
        this.setState({ userInput: event.target.value });
    },

    render: function() {
        var self = this;

        var tagList;
        if (this.state.matchingTags.length > 0)
        {
            tagList = <div className="typeahead-list-container">
                <ul className="typeahead-list" role="menu">
                    {this.state.matchingTags.map(function (tag, i) {
                        var className = (self.state.selectedIndex === i) ? "hover" : "";
                        return React.createElement("li", {
                                className: className,
                                onClick: self.selectTag.bind(self, tag)
                            },
                            tag.name);
                    })}
                </ul>
            </div>;
        }

        return <div>
            <input className="typeahead-input form-control"
                   type="text"
                   value={this.state.userInput}
                   onChange={this.handleChange}
                   onKeyDown={this._onKeyDown} />
            {tagList}
        </div>;
    }
});

module.exports = TagAutocompletion;