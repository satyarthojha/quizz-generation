// utils/contentAnalyzer.js
const Question = require('../models/Question');
const VideoAnalytics = require('../models/VideoAnalytics');

const SEGMENT_DURATION = 30; // 30-second segments

async function analyzeVideoContent(videoId, duration) {
  // Get or create video analytics
  let analytics = await VideoAnalytics.findOne({ videoId });
  
  if (!analytics) {
    analytics = new VideoAnalytics({
      videoId,
      duration,
      segments: createEmptySegments(duration)
    });
  }

  // Get existing questions
  const questions = await Question.find({ videoId });
  
  // Update segment analytics
  analytics.segments = analytics.segments.map(segment => {
    const count = questions.filter(q => q.segment === segment.segment).length;
    return {
      ...segment.toObject(),
      questionCount: count
    };
  });

  await analytics.save();
  return analytics;
}

function createEmptySegments(duration) {
  const totalSegments = Math.ceil(duration / SEGMENT_DURATION);
  return Array.from({ length: totalSegments }, (_, i) => ({
    segment: i + 1,
    questionCount: 0,
    lastTested: null
  }));
}

function getWeakSegments(analytics, count = 3) {
  return [...analytics.segments]
    .sort((a, b) => a.questionCount - b.questionCount)
    .slice(0, count)
    .map(s => s.segment);
}

module.exports = {
  analyzeVideoContent,
  getWeakSegments
};