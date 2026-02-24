// ✅ Make sure this is at the very top
import { useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, AuthContext } from './context/AuthContext';

import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ResumeUpload from './components/ResumeUpload';
import InterviewRoom from './components/InterviewRoom';


// ============================================================
// 🔐 Private Route Wrapper
// ============================================================
const PrivateRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" />;
};


// ============================================================
// 🚀 Updated Dashboard Component (Now Stores Full Resume Data)
// ============================================================
const Dashboard = () => {

    // ✅ Hold full resume analysis result
    const [resumeData, setResumeData] = useState(null);

    return (
        <div className="pt-24 min-h-screen bg-gray-50 px-4">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Pass setter to ResumeUpload */}
                <ResumeUpload onAnalysisComplete={setResumeData} />

                {/* Only render InterviewRoom when resumeData exists */}
                {resumeData && (
                    <InterviewRoom
                        role={resumeData.predictedRole}
                        atsScore={resumeData.atsScore}
                    />
                )}

            </div>
        </div>
    );
};


// ============================================================
// 📌 App Routes
// ============================================================
function AppRoutes() {
    return (
        <div className="font-sans text-gray-900">
            <Navbar />

            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 🔐 Protected Dashboard Route */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </div>
    );
}


// ============================================================
// 🌍 Main App Wrapper
// ============================================================
export default function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}