var express = require('express');
var Path = require('path');
var request = require('request');
var routes = express.Router();
var bodyParser = require('body-parser');
var db = require('./model/db');
var Users = require('./model/users');
var Shifts = require('./model/shifts');
var Chats = require('./model/chats');
var helpers = require('./config/helpers');
var isAuthenticated = require('./config/helpers').isAuthenticated;
var Pickup = require('./model/pickup')

var AuthModule = require('./config/AuthModule');
var TokenService = require('./config/TokenService');
var authCtrl = require('./controllers/auth.ctrl');


if(!process.env.API){
  var api = require( './api' ).api;
} else {
  var api = process.env.API;
}

//route to your index.html
//
var assetFolder = Path.resolve(__dirname, '../client/');
routes.use(express.static(assetFolder));

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}
//=========================
// Authorization Endpoints
//=========================

routes.post('/auth/facebook', authCtrl.facebookAuth, authCtrl.retrieveUser, authCtrl.generateToken, function (req, res) {
    res.json({ token: req.genertedTokenn });
});

routes.get('/protected', isAuthenticated, function(req,res){
  res.send('Welcome');

})
//=========================
//    /pickup Endpoints
//=========================

routes.post('/pickup', function(req, res){
  var NewPickup = new Pickup(req.body);
  NewPickup.save(function(err, post){
    if(err){
      console.log("Error in pickup shift")
      res.status(500).send({error: err.message})
    }
    res.status(201).send(post);
  })
})

//=========================
//    /shift Endpoints
//=========================

routes.get('/shifts/lat/:lat/lng/:lng/rad/:rad', function(req, res) {
  //  data comes in get request shifts/lat/30.27809839999999/lng/-97.74443280000003/rad/500
  request('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='
    + req.params.lat + ',' + req.params.lng + '&radius=' + req.params.rad +'&name=starbucks&key=' + api,
    function(err, resp, body) {
      var theBody = JSON.parse(body);
      // console.log(TheBody.status);
      if(err){
        res.status(resp.statusCode).send(err.message);
      }
      if(!err && resp.statusCode === 200) {
        helpers.addShiftsToGoogleResponse(req, res, body);
      }
    });
});

routes.post('/shifts', function(req, res){
  var NewShift = new Shifts(req.body);
  NewShift.save(function(err, post){
    if (err){
      console.error('Error in the shifts post');
      res.status(500).send({error: err.message})
    }
    res.status(201).send(post);
  })
})

routes.patch('/shifts', function(req, res){
  // { _id: afhaksjfhksaj, changed: { prize : 25.00, shift_end : "Sat Sep 24 2016 22:00:00 GMT-0500 (CDT)" } }
  Shifts.findOneAndUpdate({_id: req.body._id}, {$set: req.body.changed}, {new: true}, function(err, shift) {
    if (err) {
      console.error(err.message);
      res.status(404).send({error: err.message});
    }
    res.status(200).send(shift);
  })
})

routes.delete('/shifts', function(req, res) {
  console.log("this is the delete body: ", req.body);
  Shifts.remove(req.body, function(err){
    if(err) {
      console.error(err.message);
      res.status(500).send({error: err.message});
    }
    res.status(204).end();
  })
});

if(process.env.NODE_ENV !== 'test') {

  // The get shift route returns an object of all google place objects with
  // relevant data from the shift database

  //
  // The Catch-all Route
  // This is for supporting browser history pushstate.
  // NOTE: Make sure this route is always LAST.
  //
  routes.get('/*', function(req, res){
    res.sendFile( assetFolder + '/index.html' )
  })

  //
  // We're in development or production mode;
  // create and run a real server.
  //
  var app = express();

  // Parse incoming request bodies as JSON
  app.use( require('body-parser').json() );
  app.use(allowCrossDomain);

  // Token deserialization
  // Check for token existence and extract the user payload
  app.use(function (req, res, next) {
    var token = new TokenService(req.headers);

    req.isAuthenticated = token.isAuthenticated;
    req.tokenPayload = token.getPayload();
    req.user = {
      _id: req.tokenPayload._id
    };

    next();
  });

  // Mount our main router
  app.use('/', routes);

  // Start the server!
  var port = process.env.PORT || 4000;
  app.listen(port);
  console.log("Listening on port", port);
} else {
  // We're in test mode; make this file importable instead.
  module.exports = routes;
}