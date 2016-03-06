var gulp = require("gulp"),
    ts = require("gulp-typescript"),
    nodemon = require("gulp-nodemon"),
    mocha = require("gulp-mocha"),
    util = require("gulp-util"),
    rimraf = require("rimraf");

var tsOptions = {module: "commonjs", target: "es6", experimentalDecorators: true};

gulp.task("clean-tests", function (cb) {
    return rimraf("deploy-tests", cb);
});

gulp.task("build-tests", ["clean-tests"], function () {
    console.log("Compiling Laputin for tests");
    return gulp.src(["app/**/*.ts"])
               .pipe(ts(tsOptions)).js.pipe(gulp.dest("deploy-tests"));
});

gulp.task("test", ["build-tests"], function () {
    return gulp.src(['deploy-tests/**/*.spec.js'], { read: false })
        .pipe(mocha({ reporter: 'spec' }))
        .on('error', util.log);
});
