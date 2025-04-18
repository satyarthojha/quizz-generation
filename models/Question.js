// models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true
  },
  question: String,
  options: [String],
  correctAnswer: String,
  timestamp: Number, // Video timestamp in seconds
  segment: Number // 30-second interval marker
});

module.exports = mongoose.model('Question', questionSchema);