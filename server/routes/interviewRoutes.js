const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { analyzeResume, analyzeEmotion } = require('../services/mlService');
const Interview = require('../models/Interview');
const Groq = require('groq-sdk');


// ============================================================
// 🔹 Helper Function 1: Mock Recommendation Engine
// ============================================================
const getRecommendations = (predictionStr) => {
    const role = predictionStr.toLowerCase();

    if (
        role.includes('data') ||
        role.includes('machine learning') ||
        role.includes('ml') ||
        role.includes('ai')
    ) {
        return [
            { name: "Jaguar Land Rover AI", role: "Machine Learning Engineer", match: "96%", type: "Enterprise" },
            { name: "BMW Group IT", role: "AI Systems Architect", match: "91%", type: "Enterprise" },
            { name: "Mindful AI", role: "NLP Data Scientist", match: "88%", type: "Startup" }
        ];
    } 
    else if (
        role.includes('web') ||
        role.includes('software') ||
        role.includes('react') ||
        role.includes('mern')
    ) {
        return [
            { name: "Chennapatnam Tech", role: "Full Stack MERN Developer", match: "94%", type: "Startup" },
            { name: "Mercedes-Benz R&D", role: "Frontend React Engineer", match: "89%", type: "Enterprise" },
            { name: "Google", role: "Software Engineer III", match: "82%", type: "Big Tech" }
        ];
    }

    return [
        { name: "TechCorp Global", role: "Technology Analyst", match: "85%", type: "Enterprise" },
        { name: "InnovateLabs", role: "Software Associate", match: "80%", type: "Startup" }
    ];
};


// ============================================================
// 🔹 Helper Function 2: Question Generator
// ============================================================
const generateQuestions = (role) => {
    const lowerRole = role.toLowerCase();

    if (lowerRole.includes('machine') || lowerRole.includes('data') || lowerRole.includes('ai')) {
        return [
            "Explain the difference between supervised and unsupervised learning.",
            "What is overfitting and how do you prevent it?",
            "Explain bias-variance tradeoff.",
            "How does a Random Forest work?",
            "What is the difference between CNN and RNN?"
        ];
    }

    if (lowerRole.includes('react') || lowerRole.includes('mern') || lowerRole.includes('web')) {
        return [
            "What is the virtual DOM in React?",
            "Explain the MERN stack architecture.",
            "What are React hooks?",
            "How does JWT authentication work?",
            "Explain REST vs GraphQL."
        ];
    }

    return [
        "Tell me about yourself.",
        "What are your strengths and weaknesses?",
        "Describe a challenging project you worked on.",
        "Where do you see yourself in 5 years?",
        "Why should we hire you?"
    ];
};


// ============================================================
// 🔹 Route 1: Upload Resume & Parse
// ============================================================
// ============================================================
// Route 1: Upload Resume & Parse (UPDATED)
// ============================================================
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { jobDescription } = req.body;
        if (!jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        // Send file and JD to Python Microservice
        const mlResponse = await analyzeResume(
            req.file.buffer,
            req.file.originalname,
            jobDescription
        );

        // Send real data straight back to React
        res.json({
            message: 'Resume processed successfully',
            data: mlResponse
        });

    } catch (error) {
        console.error("Resume Upload Error:", error);
        res.status(500).json({
            error: 'Server error processing resume'
        });
    }
});


// ============================================================
// 🔹 Route 2: Real-time Emotion Detection
// ============================================================
// ============================================================
// Route 2: Real-time Emotion Detection (UPDATED & BULLETPROOF)
// ============================================================
// Using upload.any() prevents the "Unexpected field" crash
router.post('/analyze-frame', upload.any(), async (req, res) => {
    try {
        // Because we use upload.any(), Multer puts the file in an array called req.files
        const file = req.files && req.files.length > 0 ? req.files[0] : null;

        if (!file) {
            return res.status(400).json({ error: 'No frame uploaded' });
        }

        const mlResponse = await analyzeEmotion(
            file.buffer,
            file.originalname || 'frame.jpg'
        );

        res.json({
            data: mlResponse
        });

    } catch (error) {
        console.error("Emotion Analysis Error:", error.message);
        res.status(500).json({
            error: 'Server error analyzing emotion'
        });
    }
});


// ============================================================
// 🔹 Route 3: Get Interview Questions
// ============================================================
// ============================================================
// Route 3: Get Dynamic AI Interview Questions (UPDATED)
// ============================================================
// ============================================================
// Route 3: Get Dynamic AI Interview Questions (Groq/Llama 3)
// ============================================================
router.get('/questions', async (req, res) => {
    try {
        const role = req.query.role || 'General Developer';

        // 1. Check if the API key exists
        if (!process.env.GROQ_API_KEY) {
            console.warn("⚠️ No Groq API Key found. Falling back to hardcoded questions.");
            const fallbackQuestions = generateQuestions(role);
            return res.json({ data: fallbackQuestions });
        }

        // 2. Initialize Groq
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // 3. Craft the strict prompt
        const prompt = `You are an expert technical interviewer hiring for a company. 
        Generate exactly 5 technical interview questions for a candidate applying for the role of "${role}". 
        Make the questions medium-to-hard difficulty. 
        Return ONLY a raw JSON array of 5 strings. Do not include markdown formatting, backticks, or the word "json".`;

        // 4. Call the Llama 3 model via Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                }
            ],
            model: "llama-3.3-70b-versatile", // Lightning fast 8-billion parameter model
            temperature: 0.5,
        });

        let responseText = chatCompletion.choices[0]?.message?.content?.trim();

        // 5. Clean up any accidental markdown the AI might have added
        responseText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();

        // 6. Parse the string into a real JavaScript Array
        let questions;
        try {
            questions = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse Groq response:", responseText);
            questions = generateQuestions(role); // Fallback if formatting fails
        }

        // 7. Send the dynamic questions back!
        res.json({ data: questions });

    } catch (error) {
        console.error("Groq AI Generation Error:", error);
        // Fallback to offline questions if the API request completely fails
        res.json({ data: generateQuestions(req.query.role || 'General Developer') });
    }
});


// ============================================================
// 🔹 Route 4: Calculate Final Scorecard
// ============================================================
router.post('/calculate-score', (req, res) => {
    try {
        const { atsScore = 0, confidenceScore = 0 } = req.body;

        const ats = Number(atsScore) || 0;
        const conf = Number(confidenceScore) || 0;

        // Simple weighted final score: 40% ATS, 60% confidence (0-100 scale)
        const finalScore = Math.min(Math.round((0.4 * ats) + (0.6 * conf)), 100);

        const scorecard = {
            finalScore,
            components: {
                atsScore: ats,
                confidenceScore: conf
            },
            message: finalScore >= 75 ? 'Strong candidate' : finalScore >= 50 ? 'Consider for interview' : 'Needs improvement'
        };

        res.json({ data: scorecard });
    } catch (error) {
        console.error('Calculate Score Error:', error);
        res.status(500).json({ error: 'Server error calculating final score' });
    }
});


// ============================================================
// 🚨 THIS MUST BE THE LAST LINE
// ============================================================
module.exports = router;