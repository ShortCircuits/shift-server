var Shifts = require('../model/shifts');

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
      //console.log("the appended google Object is: ", googleObj)
      // return the google Obj with its' appended data
      res.status(200).send(googleObj);
    }) // end of the Shifts.find.
  }, // end of our helper function

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





