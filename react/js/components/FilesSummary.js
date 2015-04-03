var FilesSummary = React.createClass({
    render: function() {
        return <p>Showing {this.props.items.length} matching items</p>;
    }
});

module.exports = FilesSummary;