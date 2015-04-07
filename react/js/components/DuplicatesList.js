var React = require("react");
var _ = require("underscore");

var LaputinAPI = require("../utils/LaputinAPI");

var DuplicatesList = React.createClass({
    getInitialState: function () {
        var self = this;
        LaputinAPI.getDuplicates(function (duplicates) {
            self.setState({ "duplicates": duplicates })
        });

        return {
            duplicates: {}
        };
    },

    render: function () {
        return <div>
            <h1>Duplicates</h1>

            <p>There seem to be some duplicates in your collection. Only one copy of these files will be used and the other is ignored.</p>

            <p>In case there are two different files with same calculated hash, please select a more thorough hashing algorithm.</p>

            <table className="table table-striped">
                <tbody>
                    {_.mapObject(this.state.duplicates, function (val, key) {
                        return <tr>
                            <td>
                                <strong>{key}</strong>
                                <ul>
                                    {val.map(function (file) {
                                        return <li>{file.path}</li>;
                                    })}
                                </ul>
                            </td>
                        </tr>;
                    })}
                </tbody>
            </table>
        </div>;
    }
});

module.exports = DuplicatesList;