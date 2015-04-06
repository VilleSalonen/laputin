var _ = require("underscore");
var React = require("react");

var FileTagList = require("./FileTagList");
var TagAutocompletion = require("./TagAutocompletion");
var LaputinAPI = require("./../utils/LaputinAPI");

var File = React.createClass({
    getInitialState: function () {
        return {
            "mode": "read",
            tags: this.props.file.tags,
            newTagName: ""
        }
    },

    addToSelected: function (tag) {
        var self = this;
        LaputinAPI.addTag(this.props.file, tag, function () {
            self.state.tags.push(tag);
            self.setState({ "tags": self.state.tags });
        });
    },

    edit: function () {
        this.setState({ "mode": "edit" });
    },

    cancel: function () {
        this.setState({ "mode": "read" });
    },

    remove: function (tag) {
        var self = this;
        LaputinAPI.deleteTagFileAssoc(this.props.file, tag, function () {
            self.setState({ "tags": _.without(self.state.tags, tag) });
        });
    },

    handleNewTagNameChange: function (e) {
        this.setState({ "newTagName": e.target.value });
    },

    onKeyDown: function (e) {
        var self = this;
        if (e.keyCode === 13 || e.keyCode === 14) {
            LaputinAPI.createTag(this.state.newTagName, function (tag) {
                self.setState({ "newTagName": "" });
                self.addToSelected(tag);
            });
        }
    },

    render: function() {
        if (this.state.mode === "edit") {
            var remove = this.remove;
            return <div>
                <p><a onClick={this.cancel}><strong>{this.props.file.name}</strong></a></p>
                <div className="row">
                    <div className="col-md-2">
                        <TagAutocompletion callback={this.addToSelected} selectedTags={this.state.tags} unassociated="1" />
                        <input type="text" value={this.newTagName} onChange={this.handleNewTagNameChange} onKeyDown={this.onKeyDown} />
                    </div>
                    <div className="col-md-10">
                        {this.state.tags.map(function (tag) {
                            var hack = function () { remove(tag) };
                            return <button onClick={hack} className="btn btn-success">{tag.name}</button>;
                        })}
                    </div>
                </div>
            </div>
        }

        return <div>
            <a onClick={this.edit}>{this.props.file.name}</a>
            <FileTagList tags={this.state.tags} />
        </div>;
    }
});



module.exports = File;