var mongoose = require('mongoose');

var usersSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {type: String, unique:true},
  phone: String,
  profilePicture: String,
  home_store: String,
  rating: Number,
  profile: {facebook: String},
  tokens: Array
}, { timestamps: true });

var Users = module.exports = mongoose.model('Users', usersSchema);