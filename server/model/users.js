var mongoose = require('mongoose');

var usersSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {type: String, unique:true},
  phone: String,
  profilePicture: String,
  home_store: {storeId: String, address: String},
  rating: Number,
  profiles: {facebook: String},
  token: Array
}, { timestamps: true });

var Users = module.exports = mongoose.model('Users', usersSchema);