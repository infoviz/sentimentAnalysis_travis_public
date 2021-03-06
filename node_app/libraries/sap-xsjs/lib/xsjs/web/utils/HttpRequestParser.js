'use strict';

var util = require('util');
var qs = require('querystring');
var cookieParser = require('cookie');
var CRLF = require('../../constants').WEB.MESSAGES.LINE_BREAK;
var HeadersParser = require('./HeadersParser');

exports.parse = function(requestString) {
  var parsedRequest = {};

  parseRequestLine(requestString, parsedRequest);
  parseHeaders(requestString, parsedRequest);
  parseCookie(parsedRequest);
  parseBody(requestString, parsedRequest);
  parseParamsFromBody(parsedRequest);

  return parsedRequest;
};

function parseRequestLine(requestString, parsedRequest) {
  var endOfRequestLine = requestString.indexOf(CRLF);
  var requestLine = requestString.substring(0, endOfRequestLine);
  var components = requestLine.split(' ');
  if (components.length !== 3) {
    throw new Error(util.format('HTTP request parser: request line should contain 3 components: Method, URI and protocol version. Actual: "%s"', requestLine));
  }
  parsedRequest.method = components[0];
  parsedRequest.path = parsePathFromRequestLine(components[1]);
  parsedRequest.query = parseQueryParametersFromRequestLine(components[1]);
}

function parsePathFromRequestLine(uri) {
  var beginOfQueryParameters = uri.indexOf('?');
  if (beginOfQueryParameters > -1) {
    return uri.substring(0, beginOfQueryParameters);
  } else {
    return uri;
  }
}

function parseQueryParametersFromRequestLine(uri) {
  var beginOfQueryParameters = uri.indexOf('?');
  if (beginOfQueryParameters < 0) {
    return {};
  }

  var queryParamsString = uri.substring(beginOfQueryParameters + 1);
  return qs.parse(queryParamsString);
}

function parseHeaders(requestString, parsedRequest) {
  var headersSection = extractHeadersSection(requestString);
  parsedRequest.headers = HeadersParser.parse(headersSection);
}

function extractHeadersSection(requestString) {
  var endOfRequestLine = requestString.indexOf(CRLF);
  var startOfHeadersSection = endOfRequestLine + CRLF.length;
  var endOfHeadersSection = requestString.indexOf(CRLF + CRLF);
  if (endOfHeadersSection < 0) {
    throw new Error('HTTP request parser: message is not valid - there should be a blank line after the headers');
  }
  return requestString.substring(startOfHeadersSection, endOfHeadersSection);
}

function parseCookie(parsedRequest) {
  var requestCookies = parsedRequest.headers.cookie;
  if (!requestCookies) {
    return;
  }
  parsedRequest.cookies = cookieParser.parse(requestCookies);
}

function parseBody(requestString, parsedRequest) {
  // a check for the mandatory blank line has already taken place
  var startOfBody = requestString.indexOf(CRLF + CRLF) + CRLF.length + CRLF.length;
  parsedRequest.body = requestString.substring(startOfBody);
}

function parseParamsFromBody(parsedRequest) {
  if (parsedRequest.headers['content-type'] === 'application/x-www-form-urlencoded') {
    parsedRequest['form-urlencoded'] = qs.parse(parsedRequest.body);
  }
}
