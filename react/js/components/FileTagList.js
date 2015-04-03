var FileTagList = React.createClass({
    render: function() {
        if (this.props.tags.length > 0)
        {
            return <p>
                <strong>Tags:</strong> {_.map(this.props.tags, function (tag) { return tag.name; }).join(", ")}
            </p>;
        }

        return false;
    }
});

module.exports = FileTagList;