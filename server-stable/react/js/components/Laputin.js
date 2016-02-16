var React = require("react");
var Router = require("react-router");
var RouteHandler = Router.RouteHandler;

var Header = require("./Header.js");

var Laputin = React.createClass({
    render: function() {
        return <div>
            <Header />
            <RouteHandler />
        </div>;
    }
});

module.exports = Laputin;