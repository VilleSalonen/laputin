var gulp = require("gulp"),
    ts = require("gulp-typescript"),
    nodemon = require("gulp-nodemon"),
    mocha = require("gulp-mocha"),
    util = require("gulp-util");
    
gulp.task("build", function () {
    console.log("Compiling TypeScript");
    return gulp.src(["*.ts"])
               .pipe(ts({module: "commonjs"})).js.pipe(gulp.dest("deploy"));
});

gulp.task("build-tests", function () {
    console.log("Compiling tests");
    return gulp.src(["tests/*.ts"])
               .pipe(ts({module: "commonjs"})).js.pipe(gulp.dest("deploy-tests"));
});

gulp.task("test", ["build-tests"], function () {
    return gulp.src(['deploy-tests/*.js'], { read: false })
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