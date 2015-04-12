var _ = require("underscore");
var React = require("react");

var LaputinAPI = require("../utils/LaputinAPI");

var TagsList = React.createClass({
    getInitialState: function () {
        var self = this;
        LaputinAPI.getTags({ unassociated: true }, function (tags) {
            self.setState({ tags: tags, matchingTags: tags });
        });

        return {
            tags: [],
            matchingTags: []
        };
    },

    _onChange: function (e) {
        if (e.target.value === "") {
            this.setState({ matchingTags: this.state.tags });
            return;
        }

        var matching = _.filter(this.state.tags, function (tag) { return tag.name.toLowerCase().indexOf(e.target.value.toLowerCase()) !== -1; });
        this.setState({ matchingTags: matching });
    },

    render: function () {
        return <div>
            <div className="filter-controls">
                <div className="extra-padded">
                    <div className="row">
                        <div className="col-md-4">
                            <form className="form-horizontal" onSubmit={this._onSubmit}>
                                <div className="form-group">
                                    <label for="tagAutocomplete" className="col-sm-2 control-label">Name</label>
                                    <div className="col-sm-10">
                                        <input type="text" className="form-control" onChange={this._onChange} />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <table className="table table-striped">
                <tbody>
                    <tr>
                        <th>
                            Showing {this.state.matchingTags.length} matching tags
                        </th>
                    </tr>

                    {this.state.matchingTags.map(function (tag) {
                        return <tr><td>{tag.name}</td></tr>;
                    })}
                </tbody>
            </table>
        </div>;
    }
});

module.exports = TagsList;