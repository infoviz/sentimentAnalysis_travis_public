'use strict';

var VError = require('verror');
var Client = require('./Client');
var Destination = require('../Destination');
var WebRequest = require('../../web/WebRequest');
var utils = require('../../../utils');
var constants = require('../../constants');
var httpStatusCodes = constants.httpStatusCodes;
var webTypes = constants.webTypes;

module.exports = HTTP;

function HTTP(dtDestinations, getDestinationFunction, sapPassport) {
  if (!dtDestinations || (typeof dtDestinations !== 'object')) {
    throw new TypeError('Design time destinations container object should be provided');
  }

  if (getDestinationFunction && (typeof getDestinationFunction !== 'function')) {
    throw new TypeError('Destination provider is mandatory and should be a function');
  }

  this.readDestination = function (packagename, objectname) {
    var destinationName = utils.toXSObjectId(packagename, objectname);
    if (!destinationName) {
      throw new TypeError('Valid destination packagename or objectname should be provided');
    }

    var dtDestination = dtDestinations[destinationName];
    var destination = (isAsync(getDestinationFunction)) ?
        getDestinationFunction.sync(packagename, objectname, dtDestination) :
        getDestinationFunction(packagename, objectname, dtDestination);

    if (!destination) {
      throw new VError('Destination not found (package: "%s", objectname: "%s")', packagename, objectname);
    }
    return new Destination(destination);
  };
  this.Client = Client.bind(null, sapPassport);
}

HTTP.prototype.Request = WebRequest;
HTTP.prototype.Destination = Destination;

Object.keys(httpStatusCodes).forEach(function (key) {
  Object.defineProperty(HTTP.prototype, key, {
    value: httpStatusCodes[key],
    enumerable: true
  });
});

Object.keys(webTypes).forEach(function (key) {
  Object.defineProperty(HTTP.prototype, key, {
    value: webTypes[key],
    enumerable: true
  });
});

function isAsync(getDestinationFunction) {
  return (getDestinationFunction.length > 3);
}
