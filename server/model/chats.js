var mongoose = require('mongoose');

var chatsSchema = new mongoose.Schema({
  user1: Number,
  user2: Number,
  content: String,
  dtg: Date,
});

var Chats = module.exports = mongoose.model('Chats', chatsSchema);