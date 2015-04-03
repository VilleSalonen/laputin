var FileList = React.createClass({
    render: function() {
        var createItem = function(file) {
            return <li>{file.name}</li>;
        };
        return <ul>{this.props.items.map(createItem)}</ul>;
    }
});

module.exports = FileList;