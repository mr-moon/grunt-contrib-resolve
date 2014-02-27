/*
 * grunt-contrib-coffee
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 Eric Woroshow, contributors
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function(grunt) {

  var util = require('util');
  var fs = require('fs');
  var chalk = require('chalk');
  var path = require('path');
  var esprima = require('esprima');
  var _ = require('underscore');
  var ignored = {};
  var repos = [];

  var log = function(input) {
    grunt.log.writeln(util.inspect.call(this, input, {depth: null}));
  };

  var type = function(input){
    return Object.prototype.toString.call(input).replace(/\[object ([a-z]+)\]/i, "$1").toLowerCase();
  };

  function findFileInRepos(file) {
    for (var i in repos) {
      var path = repos[i] + '/' + file;
      if (fs.existsSync(path.replace(/\/+/g, '/'))) {
        return path;
      }
    }
    return false;
  }

  function search(input, key, value) {
    switch (Object.prototype.toString.call(value)) {
      case "[object RegExp]":
        break;
      case "[object String]":
        value = new RegExp(value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), "i");
        break;
      default:
        throw new TypeError("`value` argument can be only of value String, RegExp or undefined");
    }
    var found = [];
    for (var k in input) {
      if (k === key) {
        if (value) {
          if (value.test(input[k])) {
            found.push(input);
          }
          continue;
        }
        found.push(input);
        continue;
      }
      if (_.isObject(input[k])) {
        found.push.apply(found, search(input[k], key, value));
      }
    }
    return found;
  }

  function extractPropertyResolveExpression(input) {
    var path = [];
    if ('property' in input) {
      if ('name' in input.property) {
        path.push(input.property.name);
      }
    }
    if ('object' in input) {
      if ('name' in input.object) {
        path.push(input.object.name);
      }
      if ('object' in input.object) {
        path.push(extractPropertyResolveExpression(input.object));
      }
    }
    return path.reverse().join('.');
  }

  function extractNamespaces(resolvableList) {
    var namespaces = {};
    for (var expr in resolvableList) {
      var ns = expr.replace(/\.[^\.]+$/, '');
      if (ns in namespaces === false) {
        namespaces[ns] = true;
      }
    }
    return _.keys(namespaces);
  }

  function extractCode(resolvableList) {
    var code = [];
    for (var i in resolvableList) {
      code.push('(function (){\n' + fs.readFileSync(resolvableList[i]).toString() + '\n}).call(global);');
    }
    return code;
  }

  /**
   * Parses file recursively
   * @param file
   */
  function parse(file) {
    var output = {}, structure;

    // Avoid any files, which don't end with .js
    if (!/\.js$/.test(file)) {
      return output;
    }

    // Avoid ignored files
    if (file in ignored) {
      return output;
    }

    try {
      structure = esprima.parse(fs.readFileSync(file));
    } catch (e) {
      grunt.log.error("There's an error in the '" + file + "': " + e.message);
      return output;
    }

    var signatures = search(structure.body, "type", "MemberExpression");

    // We must ignore current file before we dive into recursion
    ignored[file] = true;

    signatures.forEach(function(signature) {
      var expr = extractPropertyResolveExpression(signature);
      // TODO: Improve ignore algorithm to avoid native objects
      for (var i in repos) {
        var path;
        // We skip current signature, if it's file is not found in repositories or
        // it is marked as ignored already.
        if (!(path = findFileInRepos(expr.replace(/\.+/g, '/') + '.js')) || path in ignored) {
          return output;
        }
        // Store resolvable expression and associated file
        output[expr] = path;
        // Resolve dependencies recursively
        output = _.extend(output, parse(path));
        ignored[path] = true;
      }
    });

    return output;
  }

  var builtinRepositoryPath = path.relative('.', __dirname + '/../node_modules/resolve-repository/repository');

  grunt.registerMultiTask('resolve', 'Resolving dependencies for js files', function () {
    var options = this.options({});

    if (type(options.repos) === 'string') {
      repos = [options.repos];
    } else if (type(options.repos) === 'array') {
      repos = options.repos.splice();
    }
    
    if (repos.indexOf(builtinRepositoryPath) === -1) {
      repos.push(builtinRepositoryPath);
    }

    this.files.forEach(function(f) {
      var resolvableList = {};

      if (!f.src.length) {
        throw grunt.fatal("No source files to parse, check your Gruntfile.");
      }

      f.src.forEach(function(file){
        _.extend(resolvableList, parse(file));
      });

      var resolvedFilePath = findFileInRepos('resolved.js');

      if (!resolvedFilePath) {
        throw grunt.fatal("Unable to locate resolved.js file template in repository locations: \n " + repos.join('\n '));
      }

      _.keys(resolvableList).forEach(function(expr){
        grunt.verbose.writeln('Resolving ' + chalk.cyan(expr) + ' from ' + chalk.cyan(resolvableList[expr]));
      });

      var resolvedFileContent = fs.readFileSync(resolvedFilePath).toString();

      // Replace namespaces
      resolvedFileContent = resolvedFileContent.replace('\'%namespaces%\'', '[\'' + extractNamespaces(resolvableList).join('\',\'') + '\']');


      // Replace code
      resolvedFileContent = resolvedFileContent.replace('\'%code%\';', extractCode(resolvableList).join('\n'));

      // Write resolved file
      fs.writeFileSync(f.dest, resolvedFileContent);
    });
  });
};
