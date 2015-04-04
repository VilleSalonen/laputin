var Header = React.createClass({
    render: function () {
        return <nav className="navbar navbar-inverse navbar-static-top" role="navigation">
            <div className="container-fluid">
                <div className="navbar-header">
                    <a className="navbar-brand" href="/">Laputin</a>
                </div>

                <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <ul className="nav navbar-nav">
                        <li><a href="/">Files (!!)</a></li>
                        <li><a href="/#/tags">Tags (!!)</a></li>
                        <li><a href="/#/duplicates">Duplicates</a></li>
                    </ul>
                </div>
            </div>
        </nav>;
    }
});

module.exports = Header;