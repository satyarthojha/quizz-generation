// models/VideoAnalytics.js
const mongoose = require('mongoose');

const videoAnalyticsSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  duration: Number, // Video duration in seconds
  segments: [{
    segment: Number,
    questionCount: Number,
    lastTested: Date
  }]
});

module.exports = mongoose.model('VideoAnalytics', videoAnalyticsSchema);