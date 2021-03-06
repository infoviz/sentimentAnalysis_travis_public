'use strict';

var _ = require('lodash');
var sax = require('sax');
var VError = require('verror');

var buffUtils = require('../../utils/buffer-utils');
var compressionUtils = require('../../utils/compression-utils');
var isWebBody = require('../../utils/xs-types').isWebBody;

module.exports = SAXParser;

var UNSUPPORTED_HANDLERS = ['attlistDeclHandler', 'endDoctypeDeclHandler',
  'endNameSpaceDeclHandler', 'entityDeclHandler', 'externalEntityRefHandler',
  'notationDeclHandler', 'processingInstructionHandler', 'startDoctypeDeclHandler',
  'startNameSpaceDeclHandler', 'xmlDeclHandler'];

var UNSUPPORTED_PROPERTIES = ['currentByteIndex', 'currentColumnNumber', 'currentLineNumber'];

function SAXParser() {
  if (!(this instanceof SAXParser)) {
    return new SAXParser();
  }
  this._parser = getNewParser();
  this._parseStarted = false;

  setStartCDataSectionHandler.call(this);
  setEndCDataSectionHandler.call(this);
  setStartElementHandler.call(this);
  setEndElementHandler.call(this);
  setCharacterDataHandler.call(this);
  setCommentHandler.call(this);
  setUnsupported.call(this);
}

SAXParser.prototype.parse = function (xml, encoding) {
  if (this._parseStarted) {
    throw new Error('SAXParser.parse already started');
  }
  this._parseStarted = true;
  parseXml.sync(this._parser, getXML(xml, encoding));
};

SAXParser.prototype.reset = function () {
  this._parseStarted = false;
  this._parser = getNewParser();
};

SAXParser.prototype.resume = function () {
  throwNotSupported('resume');
};

SAXParser.prototype.stop = function (isResumable) { // eslint-disable-line no-unused-vars
  throwNotSupported('stop');
};

function setUnsupported() {
  UNSUPPORTED_HANDLERS.forEach(function (property) {
    Object.defineProperty(this, property, {
      set: throwNotSupported.bind(null, property)
    });
  }, this);

  UNSUPPORTED_PROPERTIES.forEach(function (property) {
    var notSupported = throwNotSupported.bind(null, property);
    Object.defineProperty(this, property, {
      set: notSupported,
      get: notSupported
    });
  }, this);
}

function resolveEncoding(encoding) {
  if (!encoding) {
    return 'utf8';
  }
  var bufferEncoding = buffUtils.toBufferEncoding(encoding);
  if (bufferEncoding) {
    return bufferEncoding;
  }
  throw new VError('Encoding %s not supported', encoding);
}

function extractXmlContent(arg) {
  if (!_.isString(arg) && !compressionUtils.isWebBodyOrArrayBuffer(arg)) {
    throw new Error('xml must be String, ArrayBuffer or WebBody');
  }
  return isWebBody(arg) ? arg._retrieveContent() : buffUtils.getData(arg);
}

function getXML(xml, encoding) {
  var data = extractXmlContent(xml);
  if (_.isString(data)) {
    return data;
  }
  var bufferEncoding = resolveEncoding(encoding);
  return data.toString(bufferEncoding);
}

function getNewParser() {
  return sax.parser(true, {
    xmlns: true,
    position: true,
    strictEntities: false
  });
}

function setHandler(eventName, handlerName, numberOfArguments) {
  Object.defineProperty(this, handlerName, {
    set: function (handler) {
      checkHandler(handler, handlerName, numberOfArguments);
      this._parser[eventName] = handler;
    }
  });
}

function setStartCDataSectionHandler() {
  setHandler.call(this, 'onopencdata', 'startCDataSectionHandler', 0);
}

function setEndCDataSectionHandler() {
  setHandler.call(this, 'onclosecdata', 'endCDataSectionHandler', 0);
}

function setStartElementHandler() {
  Object.defineProperty(this, 'startElementHandler', {
    set: function (startElementHandler) {
      checkHandler(startElementHandler, 'startElementHandler', 2);
      this._parser.onopentag = function startElementHandlerWrapper(node) {
        var attributes = node.attributes;
        attributes = _.omitBy(attributes, function (att) {
          return att.prefix === 'xmlns';
        });
        attributes = _.mapValues(attributes, function (attribute) {
          return attribute.value;
        });
        startElementHandler(node.name, attributes);
      };
    }
  });
}

function setEndElementHandler() {
  setHandler.call(this, 'onclosetag', 'endElementHandler', 1);
}

function setCharacterDataHandler() {
  setHandler.call(this, 'ontext', 'characterDataHandler', 1);
}

function setCommentHandler() {
  setHandler.call(this, 'oncomment', 'commentHandler', 1);
}

function parseXml(parser, xml, cb) {
  parser.onend = cb;
  parser.write(xml).close();
}

function throwNotSupported(item) {
  throw new Error(item + ' not supported');
}

function checkHandler(handler, handlerName, numberOfArguments) {
  if (typeof handler !== 'function' || handler.length !== numberOfArguments) {
    throw new VError('Expected "%s" to be a function with %d arguments', handlerName, numberOfArguments);
  }
}
