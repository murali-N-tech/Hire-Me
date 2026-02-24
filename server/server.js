require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const interviewRoutes = require('./routes/interviewRoutes');
const authRoutes = require('./routes/authRoutes');

// Basic Health Check Route
app.get('/', (req, res) => {
    res.json({ message: 'HireAI Express Node Server is running' });
});
app.use('/api/interviews', interviewRoutes);
app.use('/api/auth', authRoutes);

// Database Connection & Server Start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully');
        app.listen(PORT, () => {
            console.log(`Express server running on port ${PORT}`);
            console.log(`Bridged to ML Service at ${process.env.ML_SERVICE_URL}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error.message);
    });