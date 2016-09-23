var mongoose = require('mongoose');

var pickupSchema = new mongoose.Schema({
  user_requested: String,
  shift_id: String,
  shift_owner: String,
  approved: Boolean
});

var Pickup = module.exports = mongoose.model('Pickup', pickupSchema);