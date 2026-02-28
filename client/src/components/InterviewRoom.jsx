import { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { analyzeFrame, getQuestions, evaluateAnswer, saveInterviewResult } from '../services/api';
import { useAuth } from '../context/AuthContext'; // 🔥 Add this
import { 
    Video, 
    AlertTriangle, 
    ShieldAlert, 
    Maximize, 
    Mic, 
    MicOff, 
    Loader2, 
    BrainCircuit, 
    CheckCircle, 
    FileText, 
    User 
} from 'lucide-react';

// Convert webcam base64 → File for API consumption
const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(',');
    let mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
};

export default function InterviewRoom() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Get parameters passed from the Resume Analysis page
    const role = location.state?.role || 'Developer';
    const atsScore = location.state?.atsScore || 75;

    const webcamRef = useRef(null);

    // =============================
    // Interview Core States
    // =============================
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isInterviewActive, setIsInterviewActive] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // =============================
    // AI Metrics
    // =============================
    const [currentEmotion, setCurrentEmotion] = useState("Neutral");
    const [confidenceScores, setConfidenceScores] = useState([]);
    const [techScores, setTechScores] = useState([]);
    const [scorecard, setScorecard] = useState(null);

    // =============================
    // Proctoring
    // =============================
    const [cheatWarnings, setCheatWarnings] = useState(0);
    const [cheatLogs, setCheatLogs] = useState([]);

    // =============================
    // Speech-to-Text
    // =============================
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);

    const recordViolation = useCallback((reason) => {
        setCheatWarnings(prev => prev + 1);
        setCheatLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${reason}`]);
    }, []);

    // 1. Browser Proctoring Logic
    useEffect(() => {
        if (!isInterviewActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                recordViolation("Candidate switched tabs or minimized browser.");
                alert("WARNING: Tab switching detected. This incident has been logged.");
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isInterviewActive) {
                recordViolation("Candidate exited fullscreen mode.");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [isInterviewActive, recordViolation]);

    // 2. Fetch Questions based on Role
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await getQuestions(role);
                setQuestions(res.data.data);
            } catch (error) {
                console.error("Failed to load questions", error);
            }
        };
        fetchQuestions();
    }, [role]);

    // 3. Text-to-Speech Helper
    const speakQuestion = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    // 4. Speech Recognition (STT) Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            setTranscript(fullTranscript); 
        };
    }

    const toggleListening = () => {
        if (!recognition) return alert("Speech Recognition is only supported in Chrome.");
        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            setTranscript("");
            recognition.start();
            setIsListening(true);
        }
    };

    // 5. Start Interview Session
    const handleStartInterview = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (err) {
            console.warn("Fullscreen request failed", err);
        }
        setIsInterviewActive(true);
        if (questions.length > 0) speakQuestion(questions[0]);
    };

    // 6. Grade Answer and Progress
    const handleNextQuestion = async () => {
        if (isListening) toggleListening();
        setIsEvaluating(true);

        try {
            const currentQ = questions[currentQuestionIndex];
            const response = await evaluateAnswer({
                question: currentQ,
                answer: transcript,
                role
            });
            setTechScores(prev => [...prev, response.data.score]);
        } catch (error) {
            console.error("Evaluation failed", error);
            setTechScores(prev => [...prev, 60]); // Fallback score
        }

        setIsEvaluating(false);
        setTranscript("");

        if (currentQuestionIndex < questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            speakQuestion(questions[nextIndex]);
        } else {
            finishInterview();
        }
    };

    // 7. Calculate Final Results
    const finishInterview = async () => {
        setIsInterviewActive(false);
        if (document.fullscreenElement) document.exitFullscreen();

        const avgConf = confidenceScores.length > 0 ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length : 50;
        const avgTech = techScores.length > 0 ? techScores.reduce((a, b) => a + b, 0) / techScores.length : 75;
        const resumeScoreFinal = Number(atsScore) || 75;
        const penalty = Math.min(cheatWarnings * 5, 20);

        const finalProb = Math.max(resumeScoreFinal * 0.4 + avgTech * 0.35 + avgConf * 0.25 - penalty, 0);

        setScorecard({
            metrics: {
                resume: resumeScoreFinal.toFixed(1),
                technical: avgTech.toFixed(1),
                confidence: avgConf.toFixed(1)
            },
            finalProbability: finalProb.toFixed(1),
            status: finalProb > 75 ? "Highly Recommended" : "Requires Improvement"
        });

        setIsComplete(true);

        // 🔥 NEW: SAVE TO DATABASE
        if (user && (user._id || user.id)) {
            try {
                await saveInterviewResult({
                    userId: user._id || user.id,
                    jobRole: role,
                    resumeScore: resumeScoreFinal.toFixed(1),
                    averageEmotion: currentEmotion,
                    confidenceScore: avgConf.toFixed(1),
                    finalHiringProbability: finalProb.toFixed(1)
                });
            } catch (err) {
                console.error("Failed to save to database", err);
            }
        }
    };

    // 8. Visual AI Analysis (Emotions & Proctoring)
    const captureAndAnalyze = useCallback(async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const file = dataURLtoFile(imageSrc, "frame.jpg");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await analyzeFrame(formData);
            if (response.data?.data?.status === "success") {
                const { emotion, confidence_score, proctoring_flag } = response.data.data;
                setCurrentEmotion(emotion);
                if (confidence_score > 0) setConfidenceScores(prev => [...prev, confidence_score]);
                if (proctoring_flag && proctoring_flag !== "Clear") recordViolation(`Vision AI: ${proctoring_flag}`);
            }
        } catch (error) {
            console.error("Frame analysis failed:", error);
        }
    }, [recordViolation]);

    useEffect(() => {
        let intervalId;
        if (isInterviewActive && !isComplete) {
            intervalId = setInterval(() => captureAndAnalyze(), 5000);
        }
        return () => clearInterval(intervalId);
    }, [isInterviewActive, isComplete, captureAndAnalyze]);

    // ==========================================
    // RENDER: Final Result View
    // ==========================================
    if (isComplete && scorecard) {
        return (
            <div className="max-w-5xl mx-auto mt-10 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-8">Session Complete</h2>
                
                <div className="grid md:grid-cols-4 gap-6 mb-10">
                    <ScoreBox title="Resume Match" value={scorecard.metrics.resume} icon={<FileText className="w-4 h-4" />} />
                    <ScoreBox title="Technical AI" value={scorecard.metrics.technical} icon={<BrainCircuit className="w-4 h-4" />} />
                    <ScoreBox title="Behavioral" value={scorecard.metrics.confidence} icon={<User className="w-4 h-4" />} />
                    <div className={`rounded-2xl p-5 border-2 flex flex-col items-center justify-center ${cheatWarnings === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h4 className="text-xs font-bold uppercase mb-1 flex items-center gap-1 text-gray-500"><ShieldAlert className="w-4 h-4" /> Integrity</h4>
                        <p className={`text-2xl font-black ${cheatWarnings === 0 ? 'text-green-600' : 'text-red-600'}`}>{cheatWarnings} Flags</p>
                    </div>
                </div>

                <div className={`rounded-3xl p-10 border-4 shadow-inner ${scorecard.finalProbability > 75 ? 'bg-gradient-to-b from-green-50 to-white border-green-100' : 'bg-gradient-to-b from-yellow-50 to-white border-yellow-100'}`}>
                    <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-3">System Recommendation</h3>
                    <p className={`text-7xl font-black mb-4 ${scorecard.finalProbability > 75 ? 'text-green-600' : 'text-yellow-600'}`}>{scorecard.finalProbability}%</p>
                    <p className="font-extrabold text-gray-800 text-xl">{scorecard.status}</p>
                </div>

                <button onClick={() => navigate('/dashboard')} className="mt-8 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // ==========================================
    // RENDER: Active Interview View
    // ==========================================
    return (
        <div className="min-h-[85vh] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[80vh]">
                
                {/* Header Strip */}
                <div className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2 rounded-lg"><Video className="w-5 h-5 text-white" /></div>
                        <div>
                            <h2 className="text-lg font-bold">Proctored AI Interview</h2>
                            <p className="text-xs text-gray-400 font-medium">Target Role: {role}</p>
                        </div>
                    </div>
                    {isInterviewActive && (
                        <div className="flex gap-4 items-center">
                            {cheatWarnings > 0 && (
                                <span className="bg-red-500/20 text-red-400 font-bold px-4 py-1.5 rounded-full text-sm border border-red-500/50 flex items-center gap-2 animate-pulse">
                                    <AlertTriangle className="w-4 h-4" /> Warning Logged
                                </span>
                            )}
                            <div className="flex items-center gap-2 text-sm font-bold bg-white/10 px-4 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> LIVE
                            </div>
                        </div>
                    )}
                </div>

                {!isInterviewActive ? (
                    /* Setup / Pre-Interview Screen */
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50">
                        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <ShieldAlert className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Security Checkpoint</h2>
                        <p className="text-gray-600 mb-8 max-w-lg text-lg">
                            This session is actively proctored by AI. Ensure you are in a quiet, well-lit room. Your microphone, camera, and browser activity will be monitored.
                        </p>
                        <button
                            onClick={handleStartInterview}
                            disabled={questions.length === 0}
                            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 transition-all disabled:opacity-70 flex items-center gap-3"
                        >
                            {questions.length === 0 ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparing AI...</> : <><Maximize className="w-5 h-5" /> Enter Fullscreen & Begin</>}
                        </button>
                    </div>
                ) : (
                    /* Main Interview UI */
                    <div className="flex-1 grid md:grid-cols-12 gap-0 overflow-hidden">
                        
                        {/* LEFT PANEL: Video & Proctoring */}
                        <div className="md:col-span-5 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6">
                            <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-700 shadow-2xl aspect-video w-full group">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 flex items-center gap-2">
                                    <BrainCircuit className="w-3 h-3 text-blue-400" /> {currentEmotion}
                                </div>
                            </div>

                            <div className="flex-1 bg-gray-800/50 rounded-2xl border border-gray-700 p-4 overflow-hidden flex flex-col">
                                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Security Logs
                                </h4>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                    {cheatLogs.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center mt-4 italic">No violations detected.</p>
                                    ) : (
                                        cheatLogs.map((log, idx) => (
                                            <div key={idx} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2.5 rounded-lg flex items-start gap-2 animate-in slide-in-from-left-2">
                                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                <span>{log}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL: Question & Transcription */}
                        <div className="md:col-span-7 bg-white p-10 flex flex-col h-full overflow-y-auto">
                            <div className="mb-4">
                                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </span>
                            </div>
                            
                            <h3 className="text-3xl font-extrabold text-gray-900 mb-8 leading-tight">
                                {questions[currentQuestionIndex]}
                            </h3>

                            <div className={`flex-1 p-6 rounded-2xl border-2 transition-colors duration-300 flex flex-col ${isListening ? 'bg-blue-50/50 border-blue-200 shadow-inner' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-4">
                                    {isListening ? (
                                        <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                                            <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                                            Recording Answer...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                                            <MicOff className="w-4 h-4" /> Microphone Standby
                                        </div>
                                    )}
                                </div>
                                
                                <p className={`text-lg leading-relaxed flex-1 ${transcript ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                    {transcript || "Your spoken response will be transcribed here in real-time..."}
                                </p>
                            </div>

                            <div className="flex gap-4 mt-8 pt-4">
                                <button
                                    onClick={toggleListening}
                                    className={`flex-1 py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all border-2 ${isListening ? 'bg-white border-red-500 text-red-600 hover:bg-red-50 shadow-sm' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50 shadow-sm'}`}
                                >
                                    {isListening ? <><MicOff className="w-5 h-5"/> Finish Speaking</> : <><Mic className="w-5 h-5"/> Click to Answer</>}
                                </button>

                                <button
                                    onClick={handleNextQuestion}
                                    disabled={isEvaluating || transcript.trim() === ""}
                                    className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 hover:bg-gray-800 hover:shadow-lg transition-all"
                                >
                                    {isEvaluating ? <><Loader2 className="w-5 h-5 animate-spin" /> AI Grading...</> : (currentQuestionIndex < questions.length - 1 ? 'Submit & Next' : 'Finish Interview')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component for results box
const ScoreBox = ({ title, value, icon }) => (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col items-center justify-center">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-2">{icon} {title}</h4>
        <p className="text-3xl font-black text-gray-900">{value}%</p>
    </div>
);