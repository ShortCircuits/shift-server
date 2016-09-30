var mongoose = require('mongoose');

var pickupSchema = new mongoose.Schema({
  user_requested: String,
  shift_id: String,
  shift_owner: String,
  approved: Boolean,
  restricted: Array
});

pickupSchema.index({ user_requested: 1, shift_id: 1}, { unique: true })

var Pickup = module.exports = mongoose.model('Pickup', pickupSchema);