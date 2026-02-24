import { Link } from 'react-router-dom';
import { FileText, Video, Target, CheckCircle } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="pt-24 pb-16 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mt-16">
                    <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                        Land Your Dream Job with <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            AI-Powered Intelligence
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-10">
                        Upload your resume for instant ATS scoring, discover perfect company matches, and master your skills in our live AI interview room.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:-translate-y-1">
                            Start Free Analysis
                        </Link>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-8 mt-24">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                            <FileText className="text-blue-600 w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">1. Resume Parsing</h3>
                        <p className="text-gray-600">Our NLP engine breaks down your skills and calculates a professional ATS score instantly.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="bg-indigo-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                            <Target className="text-indigo-600 w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">2. Smart Company Match</h3>
                        <p className="text-gray-600">Get personalized company recommendations based directly on your extracted technical stack.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                            <Video className="text-purple-600 w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">3. AI Mock Interview</h3>
                        <p className="text-gray-600">Face our AI recruiter. We analyze your expressions, confidence, and answers in real-time.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}