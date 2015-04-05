var TagAutocompletion = require("./TagAutocompletion");
var SelectedTag = require("./SelectedTag");

var Search = React.createClass({
    getInitialState: function () {
        return {
            selectedTags: [],
            filename: "",
            status: "both"
        };
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
        this.props.callback({
            filename: this.state.filename,
            status: this.state.status,
            and: _.filter(this.state.selectedTags, function (tag) { return tag.mode === "AND" }),
            or: _.filter(this.state.selectedTags, function (tag) { return tag.mode === "OR" }),
            not: _.filter(this.state.selectedTags, function (tag) { return tag.mode === "NOT" })
        });
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

    render: function () {
        var removeCallback = this.remove;
        var reloadCallback = this.reload;
        return <div className="filter-controls">
            <div className="extra-padded">
                <div className="row">
                    <div className="col-md-4">
                        <form className="form-horizontal" onSubmit={this._onSubmit}>
                            <TagAutocompletion callback={this.addToSelected} selectedTags={this.state.selectedTags} />
                            <div className="form-group">
                                <label for="filename" className="col-sm-2 control-label">Filename</label>
                                <div className="col-sm-10">
                                    <input type="text" className="form-control" id="filename" onChange={this.filenameChanged} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label for="status" className="col-sm-2 control-label">Status</label>
                                <div className="col-sm-10">
                                    <select className="form-control" selected={this.status} onChange={this.statusChanged}>
                                        <option value="both">Both tagged and untagged</option>
                                        <option value="untagged">Only untagged</option>
                                        <option value="tagged">Only tagged</option>
                                    </select>
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