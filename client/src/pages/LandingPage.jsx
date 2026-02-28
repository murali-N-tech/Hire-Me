import { Link } from 'react-router-dom';
import { 
    Bot, 
    Video, 
    FileText, 
    ShieldCheck, 
    ArrowRight, 
    Sparkles, 
    Zap, 
    CheckCircle2, 
    BarChart3 
} from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white overflow-hidden selection:bg-blue-100 selection:text-blue-900">
            
            {/* ========================================== */}
            {/* HERO SECTION */}
            {/* ========================================== */}
            <div className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
                {/* Background glowing orbs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-100 via-indigo-50 to-emerald-50 rounded-full blur-[100px] opacity-70 -z-10"></div>
                <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] opacity-50 -z-10"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm mb-8 shadow-sm">
                        <Sparkles className="w-4 h-4" />
                        Powered by Llama 3 & Advanced Vision AI
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-8 leading-tight">
                        Master your next interview <br className="hidden md:block" />
                        with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">HireAI Proctoring.</span>
                    </h1>
                    
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 font-medium mb-12 leading-relaxed">
                        Experience hyper-realistic technical interviews evaluated by AI. Get instant feedback on your code, speech, and confidence before the real thing.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link 
                            to="/register" 
                            className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-1 flex items-center justify-center gap-2 group"
                        >
                            Start Practicing Now
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link 
                            to="/login" 
                            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Video className="w-5 h-5" /> View Live Demo
                        </Link>
                    </div>

                    {/* Floating Dashboard Preview Image/Mockup Concept */}
                    <div className="mt-20 relative max-w-5xl mx-auto animate-in zoom-in-95 duration-1000 delay-200">
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
                        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-200 overflow-hidden flex transform perspective-1000 rotate-x-2">
                            {/* Fake UI Header */}
                            <div className="w-full h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                        </div>
                        {/* We use a stylized grid to simulate the app interface visually */}
                        <div className="bg-gray-900 rounded-b-[2rem] p-4 grid grid-cols-3 gap-4 h-[300px] border-x border-b border-gray-800 shadow-2xl">
                            <div className="col-span-1 bg-gray-800 rounded-xl border border-gray-700 relative overflow-hidden flex items-center justify-center">
                                <Video className="w-12 h-12 text-gray-600" />
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="px-2 py-1 bg-black/50 rounded text-[10px] text-white font-bold border border-white/10">Neutral</div>
                                </div>
                            </div>
                            <div className="col-span-2 bg-white rounded-xl p-6 flex flex-col justify-between">
                                <div>
                                    <div className="w-24 h-6 bg-blue-100 rounded-md mb-4"></div>
                                    <div className="w-full h-4 bg-gray-100 rounded mb-2"></div>
                                    <div className="w-3/4 h-4 bg-gray-100 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-10 w-32 bg-gray-900 rounded-lg"></div>
                                    <div className="h-10 w-10 bg-blue-100 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* FEATURES GRID */}
            {/* ========================================== */}
            <div className="py-24 bg-gray-50 border-y border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Enterprise-Grade Interview Engine</h2>
                        <p className="text-lg text-gray-500">Everything you need to perfect your technical interview skills, packed into one seamless platform.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<FileText className="w-6 h-6 text-blue-600" />}
                            title="ATS Resume Parsing"
                            desc="Upload your PDF resume and target job description. Our NLP model scores your keyword match and semantic similarity instantly."
                        />
                        <FeatureCard 
                            icon={<Bot className="w-6 h-6 text-indigo-600" />}
                            title="Dynamic Llama 3 Questions"
                            desc="No hardcoded questions. The AI generates highly specific, medium-to-hard technical questions based entirely on the role you choose."
                        />
                        <FeatureCard 
                            icon={<Video className="w-6 h-6 text-emerald-600" />}
                            title="Live Vision Emotion AI"
                            desc="Using a local YOLOv8 engine, we track your facial expressions, confidence levels, and eye contact during the entire session."
                        />
                        <FeatureCard 
                            icon={<ShieldCheck className="w-6 h-6 text-red-600" />}
                            title="Strict Anti-Cheat Proctoring"
                            desc="Tab-switching detection, multiple-face detection, and unauthorized device (cell phone) tracking ensures complete integrity."
                        />
                        <FeatureCard 
                            icon={<Zap className="w-6 h-6 text-yellow-600" />}
                            title="Real-Time Speech-to-Text"
                            desc="Speak your answers naturally. The browser captures your voice, transcribes it, and feeds it directly into the grading model."
                        />
                        <FeatureCard 
                            icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
                            title="Comprehensive Scorecards"
                            desc="Get a final hiring probability score combining your ATS match, technical answer accuracy, and behavioral confidence."
                        />
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* HOW IT WORKS / PIPELINE */}
            {/* ========================================== */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-black text-gray-900 mb-16">Your path to the offer letter</h2>
                    
                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line (Desktop only) */}
                        <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-100 via-blue-500 to-blue-100 z-0"></div>

                        <StepCard 
                            number="1"
                            title="Upload Resume"
                            desc="Drop your PDF and target Job Description. We align the AI to your specific career goals."
                        />
                        <StepCard 
                            number="2"
                            title="Take the Interview"
                            desc="Enter the proctored room. Speak your answers live while our AI tracks your technical accuracy."
                        />
                        <StepCard 
                            number="3"
                            title="Review & Improve"
                            desc="Get a detailed breakdown of your performance, security flags, and final hiring probability."
                        />
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* BOTTOM CTA */}
            {/* ========================================== */}
            <div className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-900 z-0"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[128px] opacity-30 z-0"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full blur-[128px] opacity-30 z-0"></div>

                <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to beat the algorithm?</h2>
                    <p className="text-xl text-gray-400 mb-10 font-medium max-w-2xl mx-auto">
                        Join developers using HireAI to perfect their interview technique and land their dream jobs.
                    </p>
                    <Link 
                        to="/register" 
                        className="inline-flex items-center gap-2 px-10 py-5 bg-white text-gray-900 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
                    >
                        Create Free Account <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

        </div>
    );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl group-hover:bg-blue-50 transition-colors -z-10"></div>
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-gray-100">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed font-medium">{desc}</p>
    </div>
);

const StepCard = ({ number, title, desc }) => (
    <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-white border-4 border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-xl shadow-blue-500/10">
            {number}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 font-medium">{desc}</p>
    </div>
);