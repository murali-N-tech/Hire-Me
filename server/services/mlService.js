const axios = require('axios');
const FormData = require('form-data');

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/api/ml';

// Update the analyzeResume function to accept jobDescription
const analyzeResume = async (fileBuffer, filename, jobDescription) => {
    try {
        const formData = new FormData();
        formData.append('file', fileBuffer, { filename });
        formData.append('jobDescription', jobDescription); // Add JD to form data

        const response = await axios.post(`${ML_BASE_URL}/parse-resume`, formData, {
            headers: formData.getHeaders()
        });
        
        return response.data;
    } catch (error) {
        console.error('ML Service Resume Error:', error.response?.data?.detail || error.message);
        throw new Error('Failed to analyze resume in ML service');
    }
};

const analyzeEmotion = async (fileBuffer, filename) => {
    try {
        const formData = new FormData();
        formData.append('file', fileBuffer, { filename });

        const response = await axios.post(`${ML_BASE_URL}/detect-emotion`, formData, {
            headers: formData.getHeaders()
        });
        
        return response.data;
    } catch (error) {
        console.error('ML Service Emotion Error:', error.message);
        throw new Error('Failed to analyze emotion in ML service');
    }
};

module.exports = { analyzeResume, analyzeEmotion };