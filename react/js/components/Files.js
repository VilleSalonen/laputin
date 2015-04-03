var File = require("./File.js");

var Files = React.createClass({
    render: function() {
        return <table className="table table-striped">
            <tbody>
            <tr>
                <th>
                    Showing {this.props.files.length} matching files

                    <button className="btn btn-primary pull-right">
                        Open files
                    </button>
                </th>
            </tr>

            {this.props.files.map(function (file) { return <tr><td><File file={file} /></td></tr>; })}
            </tbody>
        </table>;
    }
});

module.exports = Files;