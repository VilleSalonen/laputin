var gulp = require("gulp"),
    ts = require("gulp-typescript"),
    nodemon = require("gulp-nodemon");
    
gulp.task("build", function () {
    console.log("Compiling TypeScript");
    return gulp.src(["*.ts"])
               .pipe(ts({module: "commonjs"})).js.pipe(gulp.dest("deploy"));
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