var LaputinAPI = require("../utils/LaputinAPI");

var TagAutocompletion = React.createClass({
    getInitialState: function () {
        var self = this;
        LaputinAPI.getTags(function (tags) {
            self.setState({ tags: tags });
        });

        return {
            matchingTags: [],
            tags: [],
            value: ""
        };
    },
    handleChange: function (event) {
        if (event.target.value.length < 4) {
            this.setState({matchingTags: []});
            return;
        }

        var matching = _.filter(this.state.tags, function (tag) {
            return tag.name.toLowerCase().startsWith(event.target.value.toLowerCase());
        });
        this.setState({ matchingTags: matching });
    },
    selectTag: function (tag) {
        this.props.callback(tag);
    },
    render: function() {
        var self = this;
        return <div>
            <input type="text" onChange={this.handleChange} />
            <ul>
                {this.state.matchingTags.map(function (tag) {
                    return <li onClick={self.selectTag.bind(self, tag)}>{tag.name}</li>;
                })}
            </ul>
            </div>;
    }
});

module.exports = TagAutocompletion;