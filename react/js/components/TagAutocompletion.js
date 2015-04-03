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
            return tag.name.startsWith(event.target.value);
        });
        this.setState({ matchingTags: matching });
    },
    render: function() {
        return <div>
            <input type="text" onChange={this.handleChange} />
            <ul>
                {this.state.matchingTags.map(function (tag) { return <li>{tag.name}</li>; })}
            </ul>
            </div>;
    }
});

module.exports = TagAutocompletion;