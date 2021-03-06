'use strict';

/*
 * Authentication strategy for passport using JSON Web Token (JWT)
 *
 * If JWT token is present and it is successfully verified, following objects are created:
 *  - request.user - according to http://passportjs.org/guide/profile/ convention
 *    - id
 *    - name
 *      - givenName
 *      - familyName
 *    - emails [ { value: <email> } ]
 *  - request.authInfo  - instance of xssec.SecurityContext
 *    - getToken(...)   - retrieve SAML token for business user to pass to HANA
 *    - checkScope(...) - authorization checks
 *    - getUserInfo()   - access raw user info
 *    - ...
 *
 * See http://jwt.io/
 * See https://www.npmjs.com/package/passport
 */

var xssec = require('..');
var debug = require('debug');
var debugTrace = debug('xssec:jwtstrategy');
var debugError = debug('xssec:jwtstrategy');

debugError.log = console.error.bind(console);
debugTrace.log = console.log.bind(console);

exports.JWTStrategy = JWTStrategy;

function JWTStrategy(options) {
  this.options = options;
  this.name = 'JWT';
}

JWTStrategy.prototype.authenticate = function (req, options) {
  var authorization = req.headers.authorization;
  if (!authorization) {
    debugTrace('Missing Authorization header');
    return this.fail(401);
  }

  var parts = authorization.split(' ');
  if (parts.length < 2) {
    debugTrace('Invalid Authorization header format');
    return this.fail(400);
  }

  var scheme = parts[0];
  var token = parts[1];

  if (scheme.toLowerCase() !== 'bearer') {
    debugTrace('Authorization header is not a Bearer token');
    return this.fail(401);
  }

  try {
    var self = this;
    if (options && options.useClientCredentialsToken) {
      return xssec.createSecurityContextCC(token, this.options, function (err, ctx) {
        if (err) {
          return err.statuscode ? self.fail(err.statuscode) : self.error(err);
        }
        self.success({}, ctx);
      });
    }
    xssec.createSecurityContext(token, this.options, function (err, ctx) {
      if (err) {
        return err.statuscode ? self.fail(err.statuscode) : self.error(err);
      }
      var userInfo = ctx.getUserInfo();
      var user = {
        id: userInfo.logonName,
        name: {
          givenName: userInfo.firstName,
          familyName: userInfo.lastName
        },
        emails: [{ value: userInfo.email }]
      };
      // passport will set these in req.user & req.authInfo respectively
      self.success(user, ctx);
    });
  }
  catch (err) {
    debugError('JWT verification error: ', err);
    this.error(err);
  }
};
