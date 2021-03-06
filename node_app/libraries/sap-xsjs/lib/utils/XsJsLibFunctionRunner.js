'use strict';

var assert = require('assert');
var util = require('util');
var runXsFunction = require('./xs-function-runner').runXsFunction;

module.exports = XsJsLibFunctionRunner;

/**
 * Constructs an object that can execute functions from given xsjslib script.
 *
 * @param {Runtime} xsjs runtime, see lib/runtime.js
 * @param {string} libId library ID according to XS1 rules, example:
 *    'foo.bar.mylib' corresponding to /foo/bar/mylib.xsjslib
 * @param {object} context execution context defining global variables, if not provided, a default one is created
 */
function XsJsLibFunctionRunner(runtime, libId, context) {
  assert(runtime && typeof runtime === 'object', 'Valid runtime should be provided');
  assert(typeof libId === 'string', 'Valid path to script should be provided');
  assert(context && typeof context === 'object', 'Valid context should be provided');

  validateLibrary(runtime, libId);

  this._scriptRunner = createScriptRunner(runtime, libId, context);
}

/**
 * Executes function from the script provided in constructor. Uses {xs-function-runner#runXsFunction}, see this
 * function for more details on how it works.
 *
 * @param functionName
 * @param thisArg
 * @param argsArray
 * @param cb
 */
XsJsLibFunctionRunner.prototype.run = function(functionName, thisArg, argsArray, cb) {
  runXsFunction(this._scriptRunner, functionName, thisArg, argsArray, cb);
};

function validateLibrary(runtime, libId) {
  var script = runtime.getLibrary(libId);
  if (!script) {
    throw new Error(util.format('Xsjs library with id "%s" not found or has errors', libId));
  }
}

function createScriptRunner(runtime, libId, context) {
  return {
    pathToScript: libId,
    runScript: function() {
      return runtime.runXsjslib(libId, context);
    }
  };
}
