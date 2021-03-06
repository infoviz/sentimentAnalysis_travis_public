'use strict';

var _ = require('lodash');
var VError = require('verror');

module.exports = {
  validateSetterArgs: validateArgs,
  validateGetterArgs: validateGetterArgs,
  validateParsedInteger: validateParsedInteger,
  validateNumber: validateNumber,
  validateInteger: validateInteger,
  numberToInteger: numberToInteger,
  validateIntegerBoundaries: validateIntegerBoundaries,
  validateDateValue: validateDateValue,
  validateString: validateString,
  validateDateTime: validateDateTime,
  INTEGER_TYPE: {
    TINY_INT: { min: 0, max: 255 },
    SMALL_INT: { min: -32768, max: 32767 },
    INTEGER: { min: -2147483648, max: 2147483647 },
    BIG_INT: { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }, // or using ctypes.INT64 for larger values
  }
};

function validateArgs(args, minNumArgs) {
  if (args.length < minNumArgs) {
    throw new VError('Expected %d arguments', minNumArgs);
  }
  var columnIndex = args[0];
  if (!_.isInteger(columnIndex) || columnIndex > module.exports.INTEGER_TYPE.INTEGER.max) {
    throw new VError('Expected integer for first argument');
  }
  if (columnIndex < 1) {
    throw new VError('Column index should be bigger than zero');
  }
  if (minNumArgs === 2 && Number.isNaN(args[1])) {
    throw new VError('Second argument is NaN (not a number)');
  }
}

function validateGetterArgs(args, minNumArgs, resultSetRow) {
  validateArgs(args, minNumArgs);

  if (_.isNull(resultSetRow)) {
    throw new Error('next() is not called for this result set');
  }
  if (_.isUndefined(resultSetRow)) {
    throw new Error('next() returned false - no results');
  }
}

function validateParsedInteger(parsedValue, rawValue) {
  if (_.isNaN(parsedValue) || (_.isString(rawValue) && rawValue.indexOf('.') > -1)) {
    throw new VError('Unsupported type conversion from %s to number. Not a valid number value: "%s"', typeof rawValue, rawValue);
  }
}

function validateNumber(value) {
  if (!_.isNumber(value)) {
    throw new VError('Expected a number as second argument');
  }
}

function validateInteger(value) {
  if (!_.isInteger(value)) {
    throw new VError('Expected an integer as second argument');
  }
}

function numberToInteger(num) {
  if (_.isInteger(num)) {
    return num;
  }
  return (num < 0) ? Math.ceil(num) : Math.floor(num);
}

function validateIntegerBoundaries(type, value) {
  if (value < type.min || value > type.max) {
    if (type === module.exports.INTEGER_TYPE.BIG_INT) {
      throw new Error('Number values are only accurate between -2^53+1 and 2^53-1. Please use ctypes.int64 objects for larger numbers');
    }
    throw new VError('Expected integer between %d and %d as second argument', type.min, type.max);
  }
}

function validateDateValue(value) {
  if (!_.isString(value) && !_.isNull(value)) {
    throw new VError('Unsupported type conversion from %s to a valid date object', typeof value);
  }
}

function validateString(value) {
  if (!_.isString(value)) {
    throw new VError('Expected a string as second argument');
  }
}

function validateDateTime(value) {
  if (!_.isDate(value) && !_.isString(value)) {
    throw new Error('Expected either a Date object or a string as second argument');
  }
}
