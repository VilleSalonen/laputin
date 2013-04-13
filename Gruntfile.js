module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    browserify: {
      default: {
        src: "app/js/app.js",
        dest: "app/js/bundle.js"
      }
    }
  });
  
  grunt.loadNpmTasks("grunt-browserify");
  
  grunt.registerTask("default", ["browserify"]);
};