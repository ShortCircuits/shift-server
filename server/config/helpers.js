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
    // do a db find for any stores that match any store IDs from the google call
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
      res.status(200).send(googleObj);
    }) // end of the Shifts.find.
  }, // end of our helper function
  findPickupShifts: function(req, res){
    var shifts = [];

    Pickup.find({$or: [{user_requested: req.user._id}, {shift_owner: req.user._id}]}, function(err, items) {
      if(err) {
        res.status(500).send({error: err.message});
      } 
      items.forEach(function(row){
        if(row.user_requested === req.user._id && row.approved){
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

  shiftAproval: function(){
    Pickup.find({shift_owner: req.user._id}, function(err, items) {
      if(err) {
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
        res.status(500).send({error: error.message});
      }
    });
    Pickup.findOneAndUpdate({_id: req.body.pickupId}, {
      approved: true, 
      rejected: false
    }, function(error,success){
      if(error) {
        res.status(500).send({error: error.message});
      }
    });
    Pickup.update({shift_id: req.body.shiftId, _id: {$ne: req.body.pickupId}}, {
      approved: false, 
      rejected: true
    }, { multi: true }, function(error,success){
      if(error) {
        res.status(500).send({error: error.message});
      }
      res.status(200).send(req.body.shiftId);
    });
  },

  deletePickups: function(req, res, next) {
    Pickup.remove({shift_id: req.body._id}, function(err, pickups) {
      if(err) {
        return res.status(500).send({error: err.message});
      }
      return next()

    })
  },
    
    //middleware for checking user authentication and locking down endpoints
  isAuthenticated: function(req,res,next){
    if(req.isAuthenticated){
      return next();
    }
    if(req.xhr){
      return res.status(401).send({"error": "Unauthorized"});
    } else {
      return res.status(401).send({"error": "Unauthorized"});
    }
  }

} // end of the module.exports
