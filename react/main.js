var React = require("react");
var Router = require("react-router");

var Laputin = require("./js/components/Laputin");
var FileList = require("./js/components/FileList");
var TagsList = require("./js/components/TagsList");
var DuplicatesList = require("./js/components/DuplicatesList");

var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;
var RouteHandler = Router.RouteHandler;
var Link = Router.Link;

var NotFound = React.createClass({
    render: function () {
        return <p>Not found</p>;
    }
});

var routes = (
    <Route handler={Laputin}>
        <DefaultRoute handler={FileList} />
        <Route name="tags" handler={TagsList} />
        <Route name="duplicates" handler={DuplicatesList} />

        <NotFoundRoute handler={NotFound} />
    </Route>
);

Router.run(routes, function (Handler) {
    React.render(<Handler/>, document.getElementById("container"));
});
