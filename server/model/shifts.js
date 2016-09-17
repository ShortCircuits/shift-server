var mongoose = require('mongoose');

var shiftsSchema = new mongoose.Schema({
  storeId: String,
  DTG: Date,
  prize: String,
  submitted_by: Number,
  covered_by: Number,
  covered: Boolean
});

var Shifts = module.exports = mongoose.model('Shifts', shiftsSchema);