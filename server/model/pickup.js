var mongoose = require('mongoose');

var pickupSchema = new mongoose.Schema({
  user_requested: String,
  shift_id: String,
  shift_owner: String,
  shift_owner_name: String,
  shift_where: String,
  shift_when: String,
  shift_prize: String,
  approved: Boolean,
});

pickupSchema.index({ user_requested: 1, shift_id: 1}, { unique: true })

var Pickup = module.exports = mongoose.model('Pickup', pickupSchema);