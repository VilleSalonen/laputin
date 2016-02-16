var _ = require("underscore");
var React = require("react");

var TagAutocompletion = require("./TagAutocompletion");
var SelectedTag = require("./SelectedTag");

var Search = React.createClass({
    getInitialState: function () {
        var stored = JSON.parse(localStorage.getItem("search"));
        if (stored) {
            return stored;
        }

        return this._getDefaultState();
    },

    _getDefaultState: function () {
        return {
            selectedTags: [],
            filename: "",
            status: "both"
        }
    },

    addToSelected: function (tag) {
        tag.mode = "AND";

        var self = this;
        var tags = this.state.selectedTags.slice();
        tags.push(tag);

        this.setState({ selectedTags: tags }, function () {
            self.reload();
        });
    },

    remove: function (tag) {
        var self = this;
        var filtered = _.without(this.state.selectedTags, tag);
        this.setState({ selectedTags: filtered }, function () {
            self.reload();
        });
    },

    reload: function () {
        this.props.callback(this.state);
    },

    _onSubmit: function (e) {
        e.preventDefault();
        this.reload();
    },

    filenameChanged: function (e) {
        this.setState({ filename: e.target.value });
    },

    statusChanged: function (e) {
        var self = this;
        this.setState({ status: e.target.value }, function () {
            self.reload();
        });
    },

    clear: function () {
        var self = this;
        this.setState(this._getDefaultState(), function () {
            self.reload();
        });
    },

    render: function () {
        localStorage.setItem("search", JSON.stringify(this.state));

        var removeCallback = this.remove;
        var reloadCallback = this.reload;
        return <div className="filter-controls">
            <div className="extra-padded">
                <div className="row">
                    <div className="col-md-4">
                        <form className="form-horizontal" onSubmit={this._onSubmit}>
                            <div className="form-group">
                                <label for="tagAutocomplete" className="col-sm-2 control-label">Tags</label>
                                <div className="col-sm-10">
                                    <TagAutocompletion callback={this.addToSelected} selectedTags={this.state.selectedTags} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label for="filename" className="col-sm-2 control-label">Filename</label>
                                <div className="col-sm-10">
                                    <input type="text" className="form-control" id="filename" onChange={this.filenameChanged} value={this.state.filename} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label for="status" className="col-sm-2 control-label">Status</label>
                                <div className="col-sm-10">
                                    <select className="form-control" value={this.state.status} onChange={this.statusChanged}>
                                        <option value="both">Both tagged and untagged</option>
                                        <option value="untagged">Only untagged</option>
                                        <option value="tagged">Only tagged</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="col-sm-10 col-sm-offset-2">
                                    <p><small><a onClick={this.clear}>Clear search filters</a></small></p>
                                </div>
                            </div>

                            <input type="submit" className="submit-hack"/>
                        </form>
                    </div>
                    <div className="col-md-7 col-md-offset-1">
                        {this.state.selectedTags.map(function (tag) {
                            return <SelectedTag key={tag.id} tag={tag} removeCallback={removeCallback} reloadCallback={reloadCallback} />;
                        })}
                    </div>
                </div>
            </div>
        </div>;
    }
});

module.exports = Search;