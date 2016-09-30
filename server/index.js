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
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
}
//=========================
// Authorization Endpoints
//=========================

routes.post('/auth/facebook', authCtrl.facebookAuth, authCtrl.retrieveUser, authCtrl.generateToken, function (req, res) {
    res.json({ token: req.genertedToken });
});

routes.get('/protected', isAuthenticated, function(req,res){
  res.send('Welcome');

})
//=========================
//    /pickup Endpoints
//=========================

routes.get('/pickup', isAuthenticated, function(req, res) {
  console.log("get pickup req body: ", req.body);
  helpers.findPickupShifts(req, res);
});


// test endpoint for getting different pickups/requesters by shift Id
// routes.get('/pickup/requesters/:shiftid', function(req, res) {
//   console.log("get pickup req shiftid: ", req.params.shiftid);
//   Pickup.find( {shift_id: req.params.shiftid}, function(err, shifts){
//     if(err) {
//       console.log("Error get pickup/requesters: ", err);
//       res.status(500).send({error: err.message});
//     } 
//     res.send(shifts);
//   })
// });

//TODO: needs to check if the pickup shift already exists
routes.post('/pickup', isAuthenticated, function(req, res){
  console.log("req.body: ", req.body);
  var user = req.user._id;
  req.body.user_requested = user;
  req.body.approved = false;
  // insert shift owner into restricted field
  req.body.restricted = req.body.shift_owner;
  // find all pickups 
    var NewPickup = new Pickup(req.body);
    NewPickup.save(function(err, post){
      if(err){
        console.log("Error in pickup shift")
        res.status(500).send({error: err.message})
      }
      res.status(201).send(post);
    })
})

// Aproving shift :: TODO needs testing
routes.patch('/pickup', isAuthenticated, function(req, res) {
  // console.log("req.body: ", req.body);
  Pickup.find({shift_id: req.body.shift_id},function(err, shifts){
    if (err) {
      console.error(err.message);
      res.status(404).send({error: err.message});
    }
    
      console.log("this is shifts: ", shifts)
      console.log("this is the shifts.shift_owner: ", shifts[0].shift_owner);
      console.log("this is the req.user._id: ", req.user._id);
      // If the user making the approval is the same as the shift owner allow update patch to /pickup
      if(req.user._id === shifts[0].shift_owner){
        Pickup.findOneAndUpdate({shift_id: req.body.shift_id}, { approved: true }, function(err, shift) {
          if (err) {
            console.error(err.message);
            res.status(404).send({error: err.message});
          }
          // you can only send one > needs refactoring
          res.status(200).send(shift);
        })

      }else{
        res.status(403).send("sorry you don't have permission to aprove this shift")
      }


  })
})

// endpoint which removes pickups after approver rejects the request
routes.patch('/pickupreject', isAuthenticated, function(req, res) {
  // console.log("req.body: ", req.body);
  Pickup.find({shift_id: req.body.shift_id},function(err, shifts){
    if (err) {
      console.error(err.message);
      res.status(404).send({error: err.message});
    }
      
      console.log("this is shifts: ", shifts)
      console.log("this is the requester: ", shifts[0].user_requested)
      console.log("this is the shifts.shift_owner: ", shifts[0].shift_owner);
      console.log("this is the req.user._id: ", req.user._id);
      // If the user making the approval is the same as the shift owner allow update patch to /pickup
      if(req.user._id === shifts[0].shift_owner){
        // remove the row where the shiftId and user requested match the rejected requester's
        Pickup.remove( {$and: [{ shift_id: req.body.shift_id }, { user_requested: shifts[0].user_requested }]}, function(err, shift) {
          if (err) {
            console.error(err.message);
            res.status(404).send({error: err.message});
          }
          // you can only send one > needs refactoring
          res.status(200).send(shift);
        })

      }else{
        res.status(403).send("sorry you don't have permission to reject this shift")
      }


  })
});

//==========================
//    User/Profile Endpoints
//==========================

// Who am I call
routes.get('/whoami', function(req, res) {
  res.status(200).send(req.user._id);
});

// get Profile info to generate profile page on front end 
routes.get('/getProfileInfo', isAuthenticated, function(req,res){
  var user = req.user._id;
  console.log("=======req.user:", req.user);
  Users.find({_id: user}, function(err, profileInfo){
    console.log("========profileInfo:", profileInfo);
    if (err) {
      console.error(err.message);
      res.status(404).send({error: err.message});
    }
    res.status(200).send(profileInfo);
  });
});

//=========================
//    /user Endpoints
//=========================

//use this rout to find a user's database information, takes the id being passed in the body
//user id gets passed in the parms /user/id/5aee23431243fsdh32230034
routes.get('/user/id/:id', isAuthenticated, function(req, res) {
  var id = req.params.id;
  Users.findById(id, function(err, user) {
    if(err) {
      console.error(err.message);
      res.status(500).send({error: err.message});
    }
    if (user.profilePicture){
      var info = {
        profilePicture: user.profilePicture,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profiles: user.profiles
      }
      res.send(info);
    }
    
  })
});

routes.patch('/users', isAuthenticated, function(req, res){
  var user = req.user._id;
  console.log("user is: ", user);
  console.log("req.body: ", req.body);
  Users.findOneAndUpdate({_id: user}, {$set: req.body}, {new: true}, function(err, userData) {
    if (err) {
      console.error(err.message);
      res.status(404).send({error: err.message});
    }
    res.status(200).send(userData);
  })
})

// Rate thy user :: TODO needs isAuthenticated
routes.patch('/rateuser', isAuthenticated, function(req, res){
  var reps;

  // needs: req.body.rep, req.body.shift_id
  console.log("this is user request body ", req.body)
  Pickup.find({'_id': req.body.pickup_shift_id},function(err, shifts){
    if (err) {
      console.error(err.message);
      res.status(404).send({error: err.message});
    }
    console.log("this is pickup shift id passed in from vote user ", req.body.pickup_shift_id)
    console.log("this is the shift from pickup", shifts)
    if(shifts[0]){
      Shifts.find({'_id': shifts[0].shift_id}, function(err, shift){
        if (err) {
          console.error(err.message);
          res.status(404).send({error: err.message});
        }
        
        // check to see if the shift has ended before leting users vote on reps.
        var shiftTime = shift[0].shift_end;
        var currTime = new Date();
        if(currTime > shiftTime){
          // check to see if the person adding reps is the owner of the shift;
          if(shifts[0].shift_owner === req.user._id){  
            console.log("this is shifts", shifts)
            var requester = shifts[0].user_requested;
            // if positive set var to pos and vice versa
            if(req.body.rep){
              if(req.body.rep === 'positive'){
                reps = 'rating.positive';
              }else if(req.body.rep === 'negative'){
                reps = 'rating.negative';
              }
            }

            var action = {};
            action[reps] = 1; 

            // if user requested is part of the pickup shift then procede with updating his reps;
            Users.findOneAndUpdate({'_id': requester}, {$inc: action},function(err, items){
              if (err) {
                console.error(err.message);
                res.status(404).send({error: err.message});
              }
              res.status(201).send("Successfuly added a rep");
            })
          }
        }
      })
    }
  })
  res.send("could not submit the rating");
})

//=========================
//  /areaSearch Endpoints
//=========================

//start here tomorrow !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!***************************!

routes.get('/areaSearch/address/:address', isAuthenticated, function(req, res) {
  console.log("made it to server!")
  //  data comes in get request shifts/lat/30.27809839999999/lng/-97.74443280000003/rad/500
  request('https://maps.googleapis.com/maps/api/geocode/json?address=' + req.params.address + '&key=' + api,
    function(err, resp, body) {
      var theBody = JSON.parse(body);
      // console.log(theBody.status);
      if(err){
        res.status(resp.statusCode).send(err.message);
      }
      if(!err && resp.statusCode === 200) {
        var lat = theBody.results[0].geometry.location.lat;
        var lng = theBody.results[0].geometry.location.lng;
        request('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='
        + lat + ',' + lng + '&radius=5000&name=starbucks&key=' + api,
        function(err, resp, body) {
          var theBody = JSON.parse(body);
          // console.log(TheBody.status);
          if(err){
            res.status(resp.statusCode).send(err.message);
          }
          if(!err && resp.statusCode === 200) {
            helpers.addShiftsToGoogleResponse(req, res, body, lat, lng);
          }
        });
      }
    });
});
// https://maps.googleapis.com/maps/api/geocode/json?address=zipCode&key=AIzaSyBczNtYGmp_cAzRu0aIUzwJJSTStflsKcs

//=========================
//    /shift Endpoints
//=========================


routes.get('/shifts/lat/:lat/lng/:lng/rad/:rad', isAuthenticated, function(req, res) {
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

routes.post('/shifts', isAuthenticated, function(req, res){
  req.body.submitted_by = req.user._id;
  var NewShift = new Shifts(req.body);
  NewShift.save(function(err, post){
    if (err){
      console.error('Error in the shifts post');
      res.status(500).send({error: err.message})
    }
    res.status(201).send(post);
  })
})

routes.patch('/shifts', isAuthenticated, function(req, res){
  // { _id: afhaksjfhksaj, changed: { prize : 25.00, shift_end : "Sat Sep 24 2016 22:00:00 GMT-0500 (CDT)" } }
  Shifts.findOneAndUpdate({_id: req.body._id}, {$set: req.body.changed}, {new: true}, function(err, shift) {
    if (err) {
      console.error(err.message);
      res.status(404).send({error: err.message});
    }
    res.status(200).send(shift);
  })
})

routes.delete('/shifts', isAuthenticated, function(req, res) {
  console.log("this is the delete body: ", req.body);
  Shifts.remove(req.body, function(err){
    if(err) {
      console.error(err.message);
      res.status(500).send({error: err.message});
    }
    res.status(204).end();
  })
});

routes.get('/myshifts', isAuthenticated, function(req, res) {
  Shifts.find({submitted_by: req.user._id}, function(err, shifts){
    if(err) {
      res.status(500).send({error:err.message});
    }
    res.send(shifts);
  })
})

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

    req.isAuthenticated = token.isAuthenticated();
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