

var SelectedTag = React.createClass({
    getInitialState: function () {
        return {
            "mode": "AND"
        }
    },
    render: function() {
        return <DropdownButton bsStyle="primary" title="Moi">
            <MenuItem eventKey='1'>Action</MenuItem>
            <MenuItem eventKey='2'>Another action</MenuItem>
            <MenuItem eventKey='3'>Something else here</MenuItem>
            <MenuItem divider />
            <MenuItem eventKey='4'>Separated link</MenuItem>
        </DropdownButton>;
    }
});

module.exports = SelectedTag;