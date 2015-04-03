var TagAutocompletion = require("./TagAutocompletion");
var SelectedTag = require("./SelectedTag");

var Search = React.createClass({
    getInitialState: function () {
        return {
            selectedTags: []
        };
    },
    foo: function (lol) {
        this.state.selectedTags.push(lol);
        this.setState({ selectedTags: this.state.selectedTags });
    },
    render: function () {
        return <div>
            <TagAutocompletion callback={this.foo} />
            <ul>
                {this.state.selectedTags.map(function (tag) {
                    return <li key={tag.id}><SelectedTag tag={tag} /></li>;
                })}
            </ul>
        </div>;
    }
});

module.exports = Search;