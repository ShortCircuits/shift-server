'use strict';

var AuthModule = require('../config/AuthModule');
var TokenService = require('../config/TokenService');

module.exports = {
 facebookAuth: facebookAuth,
 googleAuth: googleAuth,
 retrieveUser: retrieveUser,
 generateToken: generateToken
};

function facebookAuth(req, res, next) {
 var options = {
   code: req.body.code,
   clientId: req.body.clientId,
   redirectUri: req.body.redirectUri
 };

 AuthModule.facebookAuthentication(options, function (err, response) {
   if (err) return next({ err: err, status: 401 });

   // for larger apps recommended to namespace req variables
   req.authObject = response;

   next();
 });
}

function googleAuth(req, res, next) {
  var options = {
    code: req.body.code,
    clientId: req.body.clientId,
    redirectUri: req.body.redirectUri
  };

  AuthModule.googleAuthentication(options, function (err, response) {
    if (err) return next({ err: err, status: 401 });

    req.authObject = response;

    next();
  });
}

function retrieveUser(req, res, next) {
 if (!req.authObject) return next({ status: 401, err: 'User not found' });

 var userToRetrieve = {
   user: req.authObject.user,
   type: req.authObject.type
 };

 AuthModule.createOrRetrieveUser(userToRetrieve, function (err, user) {
   if (err || !user) return next({ status: 401, err: 'Error while fetching user' });

   req.user = user;

   next();
 });
}

function generateToken(req, res, next) {
 TokenService.createToken({ user: req.user }, function (err, token) {
   if (err) return next({ status: 401, err: 'User Validation failed' });

   req.genertedToken = token;

   next();
 });
}