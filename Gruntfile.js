/*
 * grunt-contrib-resolve
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 Alexander Moon
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      test: ['tmp']
    },

    // Configuration to be run (and then tested).
    resolve: {
      main: {
        options: {
          repos: 'rep'
        },
        files: {
          "tmp/resolved.js": "tmp/test.js"
        }
      }
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-internal');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['resolve']);
};