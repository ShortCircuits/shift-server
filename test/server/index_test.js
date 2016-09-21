var request = require('supertest')
var routes = require(__server + '/index.js')

describe("The Server", function() {
  var shift = {
   storeId      : "ChIJPXmIAnW1RIYRRwVbIcKT_Cw",
   shift_start  : "Sat Sep 24 2016 17:00:00 GMT-0500 (CDT)",
   shift_end    : "Sat Sep 24 2016 21:00:00 GMT-0500 (CDT)",
   prize        : "$10.00",
   submitted_by : 1234,
   covered      : false
  }

  var app = TestHelper.createApp()
  app.use('/', routes)
  app.testReady()

//====================================
//      /shift Endpoint Tests
//====================================

  it("should have an endpoint named shifts that returns the Google object for a Starbucks location", function() {
    return request(app)
      .get('/shifts/lat/30.27809/lng/-97.7444/rad/500')
      .expect(200)
      .expect(function(response) {
        expect(response.body.results[0].name).to.include('Starbucks')
      })
  })

  it("should notify if there are no stores in search radius", function(){
    return request(app)
      .get('/shifts/lat/89.27809/lng/-97.7444/rad/500')
      .expect(200)
      .expect(function(response) {
        expect(response.body.status).to.include("ZERO_RESULTS")
      })
  })

  it("should notify if the coordinates are invalid", function(){
    return request(app)
      .get('/shifts/lat/99.27809/lng/-97.7444/rad/500')
      .expect(200)
      .expect(function(response) {
        expect(response.body.status).to.include("INVALID_REQUEST")
      })
  })

  it("should be able to post to shifts endpoint", function() {
    return request(app)
      .post('/shifts')
      .send(shift)
      .expect(201)
      .expect(function(response) {
        shift = response.body
        expect(response.body.storeId).to.include(shift.storeId)
      })
  })

  it("should error if database is down on posting shifts(this is just invoking the error)", function() {
    return request(app)
      .post('/shifts')
      .send({_id : "hfoiahfoieahfoiehf"})
      .expect(500)
  })

  it("should update a shift object", function() {
   // { _id: afhaksjfhksaj, changed: { prize : 25.00 } }
    var shiftUpdate = { _id : shift["_id"], changed : { prize : "$25.00" } }
    return request(app)
      .patch('/shifts')
      .send(shiftUpdate)
      .expect(200)
      .expect(function(response) {
        expect(response.body.prize).to.include("$25.00")
      })
  })

  it("should error if shift is not found", function() {
    var shiftUpdate = { _id : "2123ff33", changed : { prize : "$25.00" } }
    return request(app)
      .patch('/shifts')
      .send(shiftUpdate)
      .expect(404)
      .expect(function(response) {
        expect(response.body.error).to.exist
      })
  })

  it("should not append a shift object to store data, if store has no available shifts", function(){
    return request(app)
      .get('/shifts/lat/30.27809/lng/-97.7444/rad/700')
      .expect(200)
      .expect(function(response) {
        expect(response.body.results[1].shifts).to.be.undefined;
      })
  })

  it("should append a shift object to store data, if store has available shifts", function(){
    return request(app)
      .get('/shifts/lat/30.27809/lng/-97.7444/rad/700')
      .expect(200)
      .expect(function(response) {
        expect(response.body.results[0].shifts[0]).to.exist;
      })
  })

  it("should remove shift from the database", function() {
    return request(app)
      .delete('/shifts')
      .send({_id : shift["_id"]})
      .expect(204)
  })

  it("should error if database is down on deletions(this is just invoking the error)", function() {
    return request(app)
      .delete('/shifts')
      .send({_id : "hfoiahfoieahfoiehf"})
      .expect(500)
  })

//====================================
//   /auth/facebook Endpoint Tests
//====================================

  it("should have an endpoint '/auth/facebook' that will reply unauthorized when no user input provided", function() {
    return request(app)
      .post('/auth/facebook')
      .send({})
      .expect(401)
  })

  it("should return unauthorized when trying to access protected endpoint", function() {
    return request(app)
      .get('/protected')
      .expect(401)
      .expect(function(response){
        expect(response.body.error).to.include('Unauthorized')
      })
  })

})
