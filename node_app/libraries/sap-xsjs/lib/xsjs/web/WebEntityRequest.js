'use strict';

var util = require('util');
var ParametersTupelList = require('./TupelLists/ParametersTupelList');
var BasicWebEntity = require('./BasicWebEntity');

module.exports = WebEntityRequest;

function WebEntityRequest(arg) {
  BasicWebEntity.call(this, arg);

  if (!arg) {
    this.parameters = new ParametersTupelList();
  } else {
    var req = arg;
    this.parameters = new ParametersTupelList();
    this.parameters._addData(req.query);
    addParametersFromBody(this, req);
  }
}

util.inherits(WebEntityRequest, BasicWebEntity);

function addParametersFromBody(webEntityRequest, expressReq) {
  webEntityRequest.parameters._addData(expressReq['form-urlencoded']);
}

WebEntityRequest.create = function(headers, parameters, body) {
  var entityRequest = new WebEntityRequest();
  entityRequest.headers._addData(headers);
  entityRequest.parameters._addData(parameters);
  entityRequest.setBody(body);
  return entityRequest;
};
