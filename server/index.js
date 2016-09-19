var express = require('express');
var Path = require('path');
var request = require('request');
var routes = express.Router();
var bodyParser = require('body-parser');
var db = require('./model/db');
var Users = require('./model/users');
var Shifts = require('./model/shifts');
var Chats = require('./model/chats');

if(!process.env.API){
  var api = require( './api' ).api;
} else {
  var api = process.env.API;
}
//
//route to your index.html
//
var assetFolder = Path.resolve(__dirname, '../client/');
routes.use(express.static(assetFolder));

//
// Example endpoint (also tested in test/server/index_test.js)
//
routes.get('/api/tags-example', function(req, res) {
  res.send(['node', 'express', 'angular'])
});

routes.get('/shifts/lat/:lat/lng/:lng/rad/:rad', function(req, res) {
  //  data comes in get request shifts/lat/30.27809839999999/long/-97.74443280000003/rad/500
  request('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='
    + req.params.lat + ',' + req.params.lng + '&radius=' + req.params.rad +'&name=starbucks&key=' + api,
    function(err, resp, body) {
      if(!err && resp.statusCode === 200) {
        res.setHeader('Content-Type', "application/json");
        res.send(body);
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

routes.delete('/shifts', function(req, res) {
  console.log("this is the delete body: ", req.body);
  Shifts.remove(req.body, function(err){
    if(err) {
      console.error(err.message)
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