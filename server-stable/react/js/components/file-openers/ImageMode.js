var _ = require("underscore");
var React = require("react");

var TagAutocompletion = require("./../TagAutocompletion");
var LaputinAPI = require("./../../utils/LaputinAPI");

var ImageMode = React.createClass({
    getInitialState: function () {
        var playlist = JSON.parse(localStorage.getItem("playlist"));

        return {
            files: playlist,
            selectedFile: playlist.length > 0 ? playlist[0] : null,
            matchingTags: [],
            newTagName: "",
            showNewTagCreation: false
        };
    },

    play: function (file) {
        this.setState({ selectedFile: file });
    },

    addToSelected: function (tag) {
        var self = this;
        LaputinAPI.addTag(this.state.selectedFile, tag, function () {
            self.state.selectedFile.tags.push(tag);
            self.setState({ "tags": self.state.tags });
        });
    },

    toggle: function () {
        this.setState({ showNewTagCreation: !this.state.showNewTagCreation });
    },

    copy: function () {
        localStorage.setItem("tagClipboard", JSON.stringify(this.state.selectedFile.tags));
    },

    paste: function () {
        var self = this;
        var tags = JSON.parse(localStorage.getItem("tagClipboard"));
        if (tags) {
            _.each(tags, function (tag) {
                self.addToSelected(tag);
            });
        }
    },

    remove: function (tag) {
        var self = this;
        LaputinAPI.deleteTagFileAssoc(this.state.selectedFile, tag, function () {
            self.setState({ "tags": _.without(self.state.tags, tag) });
        });
    },

    handleNewTagNameChange: function (e) {
        this.setState({ "newTagName": e.target.value });
    },

    onKeyDown: function (e) {
        var self = this;
        if (e.keyCode === 13 || e.keyCode === 14) {
            e.preventDefault();

            LaputinAPI.createTag(this.state.newTagName, function (tag) {
                self.setState({ "newTagName": "" });
                self.addToSelected(tag);
            });
        }
    },

    render: function () {
        var self = this;

        var tags = _.sortBy(this.state.selectedFile.tags, function (tag) { return tag.name });
        var tagCreation = "";
        if (this.state.showNewTagCreation) {
            tagCreation = <form>
                <input type="text" value={this.state.newTagName} onChange={this.handleNewTagNameChange} onKeyDown={this.onKeyDown}
                       placeholder="Create a new tag" className="form-control" />
            </form>;
        }

        return <div className="video-player row">
            <div className="col-md-8 player-content">
                <div className="row">
                    <div className="col-md-2">
                        <TagAutocompletion callback={this.addToSelected} selectedTags={this.state.tags} unassociated="1" />

                        <p>
                            <small><a onClick={this.toggle}>Didn't find the tag you were looking for..?</a></small>
                        </p>

                        {tagCreation}

                        <p><small><a onClick={this.copy}>Copy</a> <a onClick={this.paste}>Paste</a></small></p>
                    </div>
                    <div className="col-md-10">
                        {tags.map(function (tag) {
                            var hack = function () { remove(tag) };
                            return <button onClick={hack} className="btn btn-success tag">{tag.name}</button>;
                        })}
                    </div>
                </div>

                <img src={"/media/" + this.state.selectedFile.name} />
            </div>
            <div className="col-md-4 player-playlist">
                <ul>
                    {this.state.files.map(function (file) {
                        var play = function () { self.play(file); };
                        if (file.hash === self.state.selectedFile.hash) {
                            return <li><strong>{file.name}</strong></li>;
                        } else {
                            return <li><a onClick={play}>{file.name}</a></li>;
                        }
                    })}
                </ul>
            </div>
        </div>;
    }
});

module.exports = ImageMode;
