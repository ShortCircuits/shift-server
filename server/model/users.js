var mongoose = require('mongoose');

var usersSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {type: String, unique:true},
  phone: String,
  profilePicture: String,
  home_store: {storeId: String, address: String},
  rating: {positive: Number, negative: Number},
  profiles: {facebook: String},
  token: Array,
  newUser: Boolean
}, { timestamps: true });

var Users = module.exports = mongoose.model('Users', usersSchema);