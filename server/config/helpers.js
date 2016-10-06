var Shifts = require('../model/shifts');
var Pickup = require('../model/pickup');

module.exports = {
  addShiftsToGoogleResponse: function(req, res, googleReturn, lat, lng){
    // for some reason we have to parse this in a var before using it...(prob bodyParser issue)
    var googleObj = JSON.parse(googleReturn);
    // the stores list is stored in the results key
    var storesArray = googleObj.results;
    googleObj.location = {lat: lat, lng: lng};
    // gather all of the store IDs to search our db with
    var storeIds = [];
    for(var i = 0; i < storesArray.length; i++){
      storeIds.push(storesArray[i].place_id);
    }
    // do a db find for any stores that match and store IDs from the google call
    Shifts.find({'home_store.storeId': {$in: storeIds}}, function(err, items){
      var dbStoreMatches = items;
      var rightNow = new Date();
      dbStoreMatches = dbStoreMatches.filter(function(obj){
        return obj.shift_end > rightNow;
      });
      // if any matches exist, append that store with a shifts object containing all shifts
      for(var i = 0; i < dbStoreMatches.length; i++){
        for(var j = 0; j < googleObj.results.length; j++){
          if(dbStoreMatches[i].home_store.storeId === googleObj.results[j].place_id){
            if(!googleObj.results[j].shifts){
              googleObj.results[j].shifts = [dbStoreMatches[i]];
            } else {
              googleObj.results[j].shifts.push(dbStoreMatches[i]);
            }
          }
        }
      }
      //console.log("the appended google Object is the following: ", googleObj)
      // return the google Obj with its' appended data
      res.status(200).send(googleObj);
    }) // end of the Shifts.find.
  }, // end of our helper function
  findPickupShifts: function(req, res){
    var shifts = [];
    // its possible that user requested and shift owner have pickups :: TODO
    Pickup.find({$or: [{user_requested: req.user._id}, {shift_owner: req.user._id}]}, function(err, items) {
      if(err) {
        console.error("pickupShifts error: ", err.message);
        res.status(500).send({error: err.message});
      } 
      // console.log("items ", items)
      items.forEach(function(row){
        if(row.user_requested === req.user._id && row.approved){
          console.log("the row", row)
          shifts.push(row)
        }else if(row.shift_owner === req.user._id && !row.approved){
          shifts.push(row)
        }
      })
      res.send(shifts);
    })
  },

  allPickupShifts: function(req, res){
    var shifts = [];
    Pickup.find({$or: [{user_requested: req.user._id}, {shift_owner: req.user._id}]}, function(err, items) {
      if(err) {
        res.status(500).send({error: err.message});
      } 
      items.forEach(function(row){
        if(row.user_requested === req.user._id){
          shifts.push(row)
        }else if(row.shift_owner === req.user._id){
          shifts.push(row)
        }
      })
      res.send(shifts);
    })
  },

  // TODO => once the user has reviewed the request for his shift to be covered
  // this endpoint will be triggered => endpoint itself needs to be added
  shiftAproval: function(){
    Pickup.find({shift_owner: req.user._id}, function(err, items) {
      if(err) {
        console.error("Shift aproval error: ", err.message);
        res.status(500).send({error: err.message});
      } 
      res.send(items);
    })
  },

  handleApproval: function(req, res){
    Shifts.findOneAndUpdate({_id: req.body.shiftId}, {
      covered: true,
      covered_by: req.body.requesterId,
      covered_by_name: req.body.requesterName,
      pickup_approved: req.body.pickupId,
      requested: []
    }, function(error,success){
      if(error) {
        console.log("handleApproval Shifts fOaU failed");
        res.status(500).send({error: error.message});
      }
      console.log("handleApproval Shifts fOaU succeeded")
    });
    Pickup.findOneAndUpdate({_id: req.body.pickupId}, {
      approved: true, 
      rejected: false
    }, function(error,success){
      if(error) {
        console.log("handleApproval Pickup fOaU failed");
        res.status(500).send({error: error.message});
      }
      console.log("handleApproval Pickup fOaU succeeded")
    });
    Pickup.update({shift_id: req.body.shiftId, _id: {$ne: req.body.pickupId}}, {
      approved: false, 
      rejected: true
    }, { multi: true }, function(error,success){
      if(error) {
        console.log("handleApproval Pickup update failed");
        res.status(500).send({error: error.message});
      }
      console.log("handleApproval Pickup update succeeded")
      res.status(200).send(req.body.shiftId);
    });
  },

  deletePickups: function(req, res, next) {
    Pickup.remove({shift_id: req.body._id}, function(err, pickups) {
      if(err) {
        console.error("error removing pickups: ", err.message);
        return res.status(500).send({error: err.message});
      }
      return next()

    })
  },
    
    //middleware for checking user authentication and locking down endpoints
  isAuthenticated: function(req,res,next){
    if(req.isAuthenticated){
      console.log("isAuthenticated ++++++")
      return next();
    }
    if(req.xhr){
      console.log("isAuthenticated fail, req.xhr")
      return res.status(401).send({"error": "Unauthorized"});
    } else {
      console.log("isAuthenticated fail, else")
      return res.status(401).send({"error": "Unauthorized"});
    }
  }

} // end of the module.exports





