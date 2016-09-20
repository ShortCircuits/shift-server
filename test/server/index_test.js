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

  it("serves an example endpoint", function() {

    // Mocha will wait for returned promises to complete
    return request(app)
      .get('/api/tags-example')
      .expect(200)
      .expect(function(response) {
        expect(response.body).to.include('node')
      })
  })

  it("should have an endpoint named shifts that returns the Google object for a Starbucks location", function() {

    return request(app)
      .get('/shifts/lat/30.27809/lng/-97.7444/rad/500')
      .expect(200)
      .expect(function(response) {
        expect(response.body.results[0].name).to.include('Starbucks')
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


})
