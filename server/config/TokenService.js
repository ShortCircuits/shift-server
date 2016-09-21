'use strict';

//babel produced line for conversion from ES2015
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
//babel produced line for conversion from ES2015
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var jwt = require('jsonwebtoken');
if (!process.env.TOKEN_SECRET) {
  var TOKEN_SECRET = require('../ts').TOKEN_SECRET;
} else {
  var TOKEN_SECRET = process.env.TOKEN_SECRET;
}

var TokenService = function () {
    function TokenService(headers) {
        _classCallCheck(this, TokenService);

        this.token = this._extractTokenFromHeaders(headers);
        this.payload = {};
        this.validToken = false;

        this._verifyToken();
    }

    _createClass(TokenService, [{
        key: 'getPayload',
        value: function getPayload() {
            return this.payload;
        }
    }, {
        key: 'isAuthenticated',
        value: function isAuthenticated() {
            return this.validToken;
        }
    }, {
        key: '_verifyToken',
        value: function _verifyToken() {
            if (!this.token) return;

            try {
                this.payload = jwt.verify(this.token, TOKEN_SECRET);
                this.validToken = true;
            } catch (err) {
                this.payload = {};
                this.validToken = false;
                console.log(err);
            }
        }
    }, {
        key: '_extractTokenFromHeaders',
        value: function _extractTokenFromHeaders(headers) {
            if (!headers || !headers.authorization) return false;

            return headers.authorization.replace('Bearer ', '');
        }
    }], [{
        key: 'createToken',
        value: function createToken(options, cb) {
            var payload = {
                profilePicture: options.user.profilePicture,
                firstName: options.user.firstName,
                lastName: options.user.lastName,
                _id: options.user._id
            };

            jwt.sign(payload, TOKEN_SECRET, {
                algorithm: 'HS256',
                expiresIn: options.expireTime || 43200 // expires in 30 days
            }, cb);
        }
    }]);

    return TokenService;
}();

module.exports = TokenService;