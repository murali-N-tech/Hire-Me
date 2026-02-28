import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);
export const uploadResume = (formData) => API.post('/interviews/upload-resume', formData);
export const analyzeFrame = (formData) => API.post('/interviews/analyze-frame', formData);
export const getQuestions = (role) => API.get('/interviews/questions', { params: { role } });
export const calculateFinalScore = (payload) => API.post('/interviews/calculate-score', payload);
export const evaluateAnswer = (payload) => API.post('/interviews/evaluate-answer', payload);