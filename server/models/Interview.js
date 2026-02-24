const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jobRole: { type: String, required: true },
    
    // Data from your Resume ML Model
    resumeScore: { type: String }, 
    extractedSkills: { type: String },
    
    // Data from your Emotion ML Model
    averageEmotion: { type: String },
    confidenceScore: { type: Number },
    
    // The final combined module
    finalHiringProbability: { type: Number },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);