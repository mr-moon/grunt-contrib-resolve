# grunt-contrib-resolve v0.0.1-alpha

> Resolve your code dependencies with ease

## About

There's 2 fundamental ideas behind the resolve plugin:

1. It's used to eliminate the boilerplate code across different JavaScript libraries. For example [jQuery](http://jquery.com/ "jQuery") and [AngularJS](http://http://angularjs.org/ "AngularJS") have plenty of boilerplate code, like type checking and iterators. They both use own implementations although they serve the same purpose and the latter is optimized to work with the former. This is of course hypothetical example, but I have an ambition to make this true.

2. It's brings dependency resolution to JavaScript. Code can be resolved from your own repositories as well as from the [built-in repository](https://github.com/mr-moon/resolve-repository "Resolve JavaScript Repository") making your production code consist of only functions that are really used. It's much like `import package.Class` in Java and `from fibo import fib` in Python.

## How it works

Let's suppose you have following components in your library (*currently, code of built-in library is illustrated*):

```
├── js
│   └── types
│       ├── isArray.js
│       ├── isString.js
│       └── type.js
└── resolved.js
```

Then, you have used `js.types.isArray([1,2,3]);` function somewhere in your application code. Now it will automatically be resolved and you don't need to include the `js/types/isArray.js` (as well as `js/types/type.js` becase it's referenced from `isArray`) before your business code executes. The `grunt-contrib-resolve` does this for you. And all you have to do is to instruct grunt to work the way you need:

```js
resolve: {
  main: {
    files: {
      "build/resolved.js": "src/app.js"
    }
  }
}
```

All dependent code will be resolved to `build/resolved.js` file. This is done by parsing (with [esprima](http://esprima.org/ "Esprima")) your code files and trying to match expression references with implementation files in repositories.

## Important notes

* Every file in package is wrapped into a closure, therefore private properties and functions stay private.

* **NB!** Files from root package are not resolved. *Yet...*

* Every public declaration in a repository file must be typed with FQDN. Take a look at content of `js/types/type.js` file of built-in repository and note how `type` function is exposed:

	```js
	var types = {
	  '[object Boolean]':  'boolean',
	  '[object Number]':   'number',
	  '[object String]':   'string',
	  '[object Function]': 'function',
	  '[object Array]':    'array',
	  '[object Date]':     'date',
	  '[object RegExp]':   'regexp',
	  '[object Object]':   'object'
	};
	
	js.types.type = function(input) {
	  if (input === void 0 || input === null) {
	    return String(input);
	  }
	  return types[Object.prototype.toString.call(input)];
	};
	```

* You can provide your own `resolved.js` template with 2 anchors `'%namespaces%'"` and `'%code%'`. Just put it into the root of your repository.

* Order of your custom repositories is important. Repository the code of the first matched fils will be resolved.

## Options

#### `repos`
Type: `string` or `array<string>`
Default: `node_modules/resolve-repository/repository` Local path to built-in repository
List of paths for your own repositories. Can be string or array of strings. The default built-in repository is alwasy appended to custom repository list. Every custom repository is treated as root package for the code files.

##### Example:
```
resolve: {
  main: {
    options: {
      repos: ['lib', 'vendor'] // lib and vendor has
    },
    files: {
      "build/resolved.js": "src/test.js"
    }
  }
}

```



## Roadmap

* Fill the built-in repository with code that people use
* Add tests
* Provide CDN for dynamic resolution with URL, i.e `http://cdn.com/reolve.js?resolve=js.types.type;js.types.isArray;js.tweening.Tween`
* Move to offical npmjs repository
* Support remote git repositories


## Getting Started

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin by following steps:

1. Add `grunt-contrib-resolve` to your dependecy list in the `package.json` file:

```json
"dependencies": {
   "grunt-contrib-resolve": "git://github.com/mr-moon/grunt-contrib-resolve.git"
}
```

2. Invoke shell command:

```shell
npm install
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-contrib-resolve');
```

## Release History

 * 2014-02-26   v0.0.1-alpha   Initial alpha release