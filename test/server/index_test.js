var request = require('supertest')
var routes = require(__server + '/index.js')

describe("The Server", function() {

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

})
