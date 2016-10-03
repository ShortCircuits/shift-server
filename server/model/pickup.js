var mongoose = require('mongoose');

var pickupSchema = new mongoose.Schema({
  user_requested: String,
  user_requested_name: String,
  shift_id: String,
  shift_owner: String,
  shift_owner_name: String,
  shift_where: String,
  shift_when: String,
  shift_prize: String,
  shift_start: Date,
  shift_end: Date,
  approved: Boolean,
  voted: Boolean
});

pickupSchema.index({ user_requested: 1, shift_id: 1}, { unique: true })

var Pickup = module.exports = mongoose.model('Pickup', pickupSchema);