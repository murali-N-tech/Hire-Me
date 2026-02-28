const express = require('express');
const router = express.Router();

const upload = require('../middlewares/uploadMiddleware');
const { analyzeResume, analyzeEmotion } = require('../services/mlService');
const Groq = require('groq-sdk');

// ============================================================
// 🔹 Fallback Questions (If AI is Offline)
// ============================================================
const generateQuestions = (role) => [
    `Can you explain a complex project you built related to ${role}?`,
    "How do you handle debugging and resolving critical production errors?",
    "Describe your experience with scalable system architecture.",
    "What is your approach to optimizing performance in your code?",
    "How do you ensure security best practices in your development?"
];

// ============================================================
// 🔹 Route 1: Upload Resume & Parse (Python NLP Microservice)
// ============================================================
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!req.body.jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        const mlResponse = await analyzeResume(
            req.file.buffer,
            req.file.originalname,
            req.body.jobDescription
        );

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
// 🔹 Route 2: Real-time Emotion & Object Detection (YOLO)
// ============================================================
router.post('/analyze-frame', upload.any(), async (req, res) => {
    try {
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
// 🔹 Route 3: Dynamic Question Generation (Groq Llama 3)
// ============================================================
router.get('/questions', async (req, res) => {
    try {
        const role = req.query.role || 'General Developer';

        if (!process.env.GROQ_API_KEY) {
            return res.json({ data: generateQuestions(role) });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const prompt = `
You are an expert technical interviewer hiring for a company.

Generate exactly 5 technical interview questions for a candidate applying for the role of "${role}".

Make the questions medium-to-hard difficulty.

Return ONLY a raw JSON array of 5 strings.
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
        });

        let responseText = chatCompletion.choices[0]?.message?.content?.trim();

        let questions;

        try {
            questions = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse AI response:", responseText);
            questions = generateQuestions(role);
        }

        res.json({ data: questions });

    } catch (error) {
        console.error("Groq Generation Error:", error);
        res.json({
            data: generateQuestions(req.query.role || 'General Developer')
        });
    }
});

// ============================================================
// 🔹 Route 4: AI Answer Evaluation (Groq Llama 3) 🔥 UPDATED
// ============================================================
router.post('/evaluate-answer', async (req, res) => {
    try {
        const { question, answer, role } = req.body;

        if (!answer || answer.trim() === '') {
            return res.json({
                score: 0,
                feedback: "No answer provided."
            });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.json({
                score: 65,
                feedback: "Offline fallback evaluation."
            });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // 🔥 UPDATED STRICT PROMPT
        const prompt = `You are a strict technical interviewer hiring for a "${role}".
Question asked: "${question}"
Candidate's spoken answer: "${answer}"

Evaluate the technical accuracy of this answer.
Return ONLY a valid JSON object with exactly two keys:
"score" (a number from 0 to 100) and
"feedback" (a short 1-sentence explanation of why they got that score).`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" } // 🔥 Forces clean JSON
        });

        let responseText = chatCompletion.choices[0]?.message?.content?.trim();

        let evaluation;

        try {
            evaluation = JSON.parse(responseText);
        } catch (e) {
            console.error("Evaluation parse failed:", responseText);
            evaluation = { score: 70, feedback: "Good attempt." };
        }

        res.json(evaluation);

    } catch (error) {
        console.error("AI Evaluation Error:", error);
        res.status(500).json({
            score: 50,
            feedback: "Server error during evaluation."
        });
    }
});

module.exports = router;