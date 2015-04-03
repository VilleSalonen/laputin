var files = [{"hash":"3ba2ad53e44601683f84952f896362c2","path":"/path/to/test1","name":"test1"}, {"hash":"f896362c23ba2ad53e44601683f84952","path":"/path/to/test2","name":"test2"}, {"hash":"a2ad53e44603952fb1683f84896362c2","path":"/path/to/test3","name":"test3"}];

var Header = require("./Header.js");
var Files = require("./Files.js");

var Laputin = React.createClass({
    render: function() {
        return <div>
            <Header />
            <Files files={files} />
        </div>;
    }
});

module.exports = Laputin;