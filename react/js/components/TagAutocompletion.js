var LaputinAPI = require("../utils/LaputinAPI");

var TagAutocompletion = React.createClass({
    _keyEvents: {
        38: "UP",
        40: "DOWN",
        13: "RETURN",
        14: "ENTER"
    },

    getInitialState: function () {
        var self = this;
        LaputinAPI.getTags(function (tags) {
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
        // This method has to use received user input to update userInput state
        // variable. Otherwise userInput state won't get updated and hence the
        // input element appears to be readonly.

        if (event.target.value.length < 3) {
            this.setState({ userInput: event.target.value, matchingTags: []});
            return;
        }

        var matching = _.filter(this.state.tags, function (tag) {
            return tag.name.toLowerCase().indexOf(event.target.value.toLowerCase()) !== -1;
        });
        matching = _.difference(matching, this.props.selectedTags);

        this.setState({ userInput: event.target.value, matchingTags: matching });
    },

    selectTag: function (tag) {
        tag.mode = "and";
        this.props.callback(tag);
        this.setState({ matchingTags: [], userInput: "", selectedIndex: -1 });
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
            }
        }
    },

    render: function() {
        var self = this;

        var tagList;
        if (this.state.matchingTags.length > 0)
        {
            tagList = <ul className="typeahead-list" role="menu">
                {this.state.matchingTags.map(function (tag, i) {
                    var className = (self.state.selectedIndex === i) ? "hover" : "";
                    return React.createElement("li", {
                            className: className,
                            onClick: self.selectTag.bind(self, tag)
                        },
                        tag.name);
                })}
            </ul>;
        }

        return <div className="form-group">
            <label for="typeahead-input" className="col-sm-2 control-label">Tags</label>
            <div className="col-sm-10">
                <input className="typeahead-input form-control"
                       id="typeahead-input"
                       type="text"
                       value={this.state.userInput}
                       onChange={this.handleChange}
                       onKeyDown={this._onKeyDown} />
                {tagList}
            </div>
        </div>;
    }
});

module.exports = TagAutocompletion;