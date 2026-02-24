import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api', // Point to the base API route
});

// Interceptor: Attach the JWT token to every request if the user is logged in
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

// Auth Routes
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);

// Interview Routes
export const uploadResume = (formData) => API.post('/interviews/upload-resume', formData);
export const analyzeFrame = (formData) => API.post('/interviews/analyze-frame', formData);
export const getQuestions = (role) => API.get('/interviews/questions', { params: { role } });
export const calculateFinalScore = (payload) => API.post('/interviews/calculate-score', payload);