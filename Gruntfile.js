module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        browserify: {
            default: {
                src: "app/js/app.js",
                dest: "app/js/bundle.js"
            }
        },

        watch: {
            scripts: {
                files: ['app/js/**/*.js'],
                tasks: ['browserify'],
                options: {
                    nospawn: true
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask("default", ["browserify"]);
};