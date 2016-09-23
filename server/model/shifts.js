var mongoose = require('mongoose');

var shiftsSchema = new mongoose.Schema({
  storeId: String,
  shift_start: Date,
  shift_end: Date,
  prize: String,
  submitted_by: String,
  covered_by: Number,
  covered: Boolean
});

var Shifts = module.exports = mongoose.model('Shifts', shiftsSchema);