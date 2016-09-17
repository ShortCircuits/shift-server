var mongoose = require('mongoose');

var usersSchema = new mongoose.Schema({
  name: String,
  home_store: String,
  rating: Number
});

var Users = module.exports = mongoose.model('Users', usersSchema);