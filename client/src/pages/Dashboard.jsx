import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInterviewHistory } from '../services/api';
import { PlusCircle, Target, Briefcase, Calendar, TrendingUp, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user || (!user._id && !user.id)) return;
            try {
                const response = await getInterviewHistory(user._id || user.id);
                setHistory(response.data.data);
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
                    <p className="text-gray-500 mt-1">Track your AI interview progress and start new sessions.</p>
                </div>
                <Link 
                    to="/analyze-resume" 
                    className="bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:-translate-y-0.5"
                >
                    <PlusCircle className="w-5 h-5" /> New Interview Session
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Quick Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-blue-100 font-medium mb-1">Total Interviews Completed</p>
                        <h2 className="text-5xl font-black">{history.length}</h2>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Target className="text-blue-500 w-5 h-5" /> Career Readiness
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Consistent practice improves your AI confidence score. Upload diverse resumes tailored to specific roles to improve ATS matching.
                        </p>
                    </div>
                </div>

                {/* Right Column: History List */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" /> Recent Sessions
                    </h2>
                    
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No interviews yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">Start your first AI-proctored interview to see your detailed performance metrics here.</p>
                            <Link to="/analyze-resume" className="text-blue-600 font-bold hover:underline">Start Session &rarr;</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((interview) => (
                                <div key={interview._id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-gray-900 text-lg">{interview.jobRole}</h3>
                                                {interview.finalHiringProbability > 75 ? (
                                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Recommended</span>
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Review Needed</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> {new Date(interview.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex gap-4 sm:gap-6 items-center">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">ATS Match</p>
                                                <p className="font-bold text-gray-900">{interview.resumeScore}%</p>
                                            </div>
                                            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Final Score</p>
                                                <p className={`text-2xl font-black ${interview.finalHiringProbability > 75 ? 'text-green-600' : 'text-gray-900'}`}>
                                                    {interview.finalHiringProbability}%
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}