(function (global) {
  'use strict';
  var namespaces = ['js.types'];
  if (namespaces.length) {
    for (var i in namespaces) {
      var ns = namespaces[i],
          scope = global,
          node,
          nodes = ns.split('.');
      while (nodes.length) {
        node = nodes.shift();
        scope = node in scope ? scope[node] : (scope[node] = {});
      }
    }
  }

  (function (){
js.types.isArray = function(input) {
  return input instanceof Array;
}
}).call(global);
})((function () {
  if (typeof window !== 'undefined') {
    return window;
  } else if (typeof exports !== 'undefined') {
    return exports;
  } else {
    throw new Error("Unsupported global scope.");
  }
})());