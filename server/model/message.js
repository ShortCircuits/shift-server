var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
  sent_by: String,
  sent_to: String,
  message: String,
  read: Boolean,
  dtg: Date
});

var Message = module.exports = mongoose.model('Message', messageSchema);