var Shifts = require('../model/shifts');
var Pickup = require('../model/pickup');

module.exports = {
  addShiftsToGoogleResponse: function(req, res, googleReturn){
    // for some reason we have to parse this in a var before using it...(prob bodyParser issue)
    var googleObj = JSON.parse(googleReturn);
    // the stores list is stored in the results key
    var storesArray = googleObj.results;
    // gather all of the store IDs to search our db with
    var storeIds = [];
    for(var i = 0; i < storesArray.length; i++){
      storeIds.push(storesArray[i].place_id);
    }
    // do a db find for any stores that match and store IDs from the google call
    Shifts.find({storeId: {$in: storeIds}}, function(err, items){
      var dbStoreMatches = items;
      // if any matches exist, append that store with a shifts object containing all shifts
      for(var i = 0; i < dbStoreMatches.length; i++){
        for(var j = 0; j < googleObj.results.length; j++){
          if(dbStoreMatches[i].storeId === googleObj.results[j].place_id){
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
    Pickup.find({$or: [{user_requested: req.user._id}, {shift_owner: req.user._id}]}, function(err, items) {
      if(err) {
        console.error("pickupShifts error: ", err.message);
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

  shiftAproval: function(){
    Pickup.find({$or: [{shift_owner: req.user._id}]}, function(err, items) {
      if(err) {
        console.error("Shift aproval error: ", err.message);
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





