var gulp = require("gulp"),
    ts = require("gulp-typescript"),
    nodemon = require("gulp-nodemon"),
    mocha = require("gulp-mocha"),
    util = require("gulp-util"),
    rimraf = require("rimraf");

gulp.task("build", function () {
    console.log("Compiling Laputin");
    return gulp.src(["*.ts"])
               .pipe(ts({module: "commonjs"})).js.pipe(gulp.dest("deploy"));
});

gulp.task("clean-tests", function (cb) {
    return rimraf("deploy-tests", cb);
});

gulp.task("build-for-tests", ["clean-tests"], function () {
    console.log("Compiling Laputin for tests");
    return gulp.src(["*.ts"])
               .pipe(ts({module: "commonjs"})).js.pipe(gulp.dest("deploy-tests"));
});

gulp.task("build-tests", ["build-for-tests"], function () {
    console.log("Compiling tests");
    return gulp.src(["tests/*.ts"])
               .pipe(ts({module: "commonjs"})).js.pipe(gulp.dest("deploy-tests/tests"));
});

gulp.task("test", ["build-tests"], function () {
    return gulp.src(['deploy-tests/tests/*.js'], { read: false })
        .pipe(mocha({ reporter: 'spec' }))
        .on('error', util.log);
});

gulp.task("watch", function () {
    gulp.watch("*.ts", ["build"]);
});

gulp.task("start", function () {
  nodemon({
    script: "deploy/index.js",
    ext: "ts html",
    env: { "NODE_ENV": "development" }
  })
});

gulp.task("start-and-watch", ["build", "watch", "start"]);