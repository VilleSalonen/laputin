var files = [{"hash":"3ba2ad53e44601683f84952f896362c2","path":"C:\\Users\\Thardas\\Desktop\\test\\Brooke Marks - Red Teardrop.wmv","tags":[],"name":"Brooke Marks - Red Teardrop.wmv"},{"hash":"60f0f757b40e3e62e71870de547b2693","path":"C:\\Users\\Thardas\\Desktop\\test\\cumming_together_big-1080.mp4","tags":[],"name":"cumming_together_big-1080.mp4"},{"hash":"4d6459dccd3d7d14e50fcad094446f06","path":"C:\\Users\\Thardas\\Desktop\\test\\IMG_4111-4113.jpg","tags":[],"name":"IMG_4111-4113.jpg"},{"hash":"8db1023866417c1268f902452b90a85c","path":"C:\\Users\\Thardas\\Desktop\\test\\lvU_gXC0u0Y-18.mp4","tags":[],"name":"lvU_gXC0u0Y-18.mp4"},{"hash":"4468b7458a1a01ecf8554b9ddaac3009","path":"C:\\Users\\Thardas\\Desktop\\test\\mfstindiasummer_512k.wmv","tags":[],"name":"mfstindiasummer_512k.wmv"},{"hash":"35d840324607c7f7d295b11e385d0581","path":"C:\\Users\\Thardas\\Desktop\\test\\mshfalexistexasbillyrem_1080.mp4","tags":[],"name":"mshfalexistexasbillyrem_1080.mp4"},{"hash":"b43de90fb84523b11547b83d7273f214","path":"C:\\Users\\Thardas\\Desktop\\test\\mshfvictoriaraekris_1080.f4v","tags":[],"name":"mshfvictoriaraekris_1080.f4v"},{"hash":"51c856a49f3a57b28741847ac671c221","path":"C:\\Users\\Thardas\\Desktop\\test\\nothing_but_heat_big-1080.mp4","tags":[],"name":"nothing_but_heat_big-1080.mp4"},{"hash":"914967f5cff02c2296554f0a7da20736","path":"C:\\Users\\Thardas\\Desktop\\test\\pussy_posse_big-1080.mp4","tags":[],"name":"pussy_posse_big-1080.mp4"},{"hash":"59d970f8c05c8fc2db6a0cbdf856f532","path":"C:\\Users\\Thardas\\Desktop\\test\\sexy_secrets_big-1080.mp4","tags":[],"name":"sexy_secrets_big-1080.mp4"},{"hash":"aad11a8d5d34ae3f681ae826c86b8d7e","path":"C:\\Users\\Thardas\\Desktop\\test\\so_lovely_big-1080.mp4","tags":[],"name":"so_lovely_big-1080.mp4"},{"hash":"ebc38892e08c3f359babd227883fd2c7","path":"C:\\Users\\Thardas\\Desktop\\test\\Tori Black - Silhouette Dance (Tori Black Is Pretty Filthy).mov","tags":[],"name":"Tori Black - Silhouette Dance (Tori Black Is Pretty Filthy).mov"},{"hash":"8e0f4557fcbc3de807f8c3c96470d843","path":"C:\\Users\\Thardas\\Desktop\\test\\FTV\\Kiara - Superfit Results (FTV Girls).wmv","tags":[],"name":"FTV\\Kiara - Superfit Results (FTV Girls).wmv"}];

var Laputin = React.createClass({
    render: function() {
        return <div>
            <Header />
            <Files />
        </div>;
    }
});

var Header = React.createClass({
    render: function () {
        return <nav className="navbar navbar-inverse" role="navigation">
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

var Files = React.createClass({
    render: function () {
        return <div>
            <FilesSummary items={files} />
            <FileList items={files} />
        </div>;
    }
});

var FilesSummary = React.createClass({
    render: function() {
        return <p>Showing {this.props.items.length} matching items</p>;
    }
});

var FileList = React.createClass({
    render: function() {
        var createItem = function(file) {
            return <li>{file.name}</li>;
        };
        return <ul>{this.props.items.map(createItem)}</ul>;
    }
});

React.render(<Laputin />, document.getElementById('container'));