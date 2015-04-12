var _ = require("underscore");
var React = require("react");

var FileTagList = React.createClass({
    render: function() {
        if (this.props.tags.length > 0)
        {
            var tags = _.chain(this.props.tags)
                        .sortBy(function (tag) { return tag.name })
                        .map(function (tag) { return tag.name; })
                        .value()
                        .join(", ");
            return <p>
                <strong>Tags:</strong> {tags}
            </p>;
        }

        return false;
    }
});

module.exports = FileTagList;