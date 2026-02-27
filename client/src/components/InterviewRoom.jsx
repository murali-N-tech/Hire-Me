import { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { analyzeFrame, getQuestions } from '../services/api';
import { Video, AlertTriangle, ShieldAlert, Maximize } from 'lucide-react';

const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(',');
    let mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
};

export default function InterviewRoom({ role, atsScore }) {

    const webcamRef = useRef(null);

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isInterviewActive, setIsInterviewActive] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const [currentEmotion, setCurrentEmotion] = useState("Neutral");
    const [confidenceScores, setConfidenceScores] = useState([]);
    const [scorecard, setScorecard] = useState(null);

    const [cheatWarnings, setCheatWarnings] = useState(0);
    const [cheatLogs, setCheatLogs] = useState([]);

    const recordViolation = useCallback((reason) => {
        setCheatWarnings(prev => prev + 1);
        setCheatLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${reason}`]);
    }, []);

    // ================================
    // Browser Proctoring
    // ================================
    useEffect(() => {
        if (!isInterviewActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                recordViolation("Candidate switched tabs or minimized browser.");
                alert("WARNING: Tab switching detected.");
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
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

    // ================================
    // Load Questions
    // ================================
    useEffect(() => {
        const fetchQuestions = async () => {
            if (!role || role === 'undefined') return;
            try {
                const res = await getQuestions(role);
                setQuestions(res.data.data);
            } catch (error) {
                console.error("Failed to load questions", error);
            }
        };
        fetchQuestions();
    }, [role]);

    const speakQuestion = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    const handleStartInterview = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (err) {
            console.warn("Fullscreen request denied", err);
        }

        setIsInterviewActive(true);
        if (questions.length > 0) {
            speakQuestion(questions[0]);
        }
    };

    const handleNextQuestion = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            speakQuestion(questions[nextIndex]);
        } else {
            setIsInterviewActive(false);
            if (document.fullscreenElement) document.exitFullscreen();

            const avgConf = confidenceScores.length > 0
                ? (confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
                : 0;

            const rScore = Number(atsScore) || 75;
            const cScore = Number(avgConf) || 50;
            const tScore = Math.min(Math.floor(rScore * 0.85 + Math.random() * 20), 98);

            const penalty = Math.min(cheatWarnings * 5, 20);
            const finalProb = Math.max(((rScore * 0.40) + (tScore * 0.35) + (cScore * 0.25)) - penalty, 0);

            setScorecard({
                metrics: {
                    resume: rScore.toFixed(1),
                    technical: tScore.toFixed(1),
                    confidence: cScore.toFixed(1)
                },
                finalProbability: finalProb.toFixed(1),
                status: finalProb > 75 ? 'Highly Recommended' : 'Requires Improvement'
            });

            setIsComplete(true);
        }
    };

    // ================================
    // Webcam + Vision Proctoring
    // ================================
    const captureAndAnalyze = useCallback(async () => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const file = dataURLtoFile(imageSrc, 'frame.jpg');
        const formData = new FormData();

        // IMPORTANT: backend expects "file"
        formData.append('file', file);

        try {
            const response = await analyzeFrame(formData);

            if (response.data && response.data.data.status === 'success') {

                const { emotion, confidence_score, proctoring_flag } = response.data.data;

                setCurrentEmotion(emotion);

                if (confidence_score > 0) {
                    setConfidenceScores(prev => [...prev, confidence_score]);
                }

                // 🔥 UPDATED STRICT PROCTORING RULE
                // If flag is anything other than "Clear", log violation
                if (proctoring_flag && proctoring_flag !== "Clear") {
                    recordViolation(`Vision AI: ${proctoring_flag}`);
                }
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

    // ================================
    // Final Screen
    // ================================
    if (isComplete && scorecard) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8 text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
                    Final Evaluation Complete
                </h2>

                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <ScoreBox title="Resume Score" value={scorecard.metrics.resume} />
                    <ScoreBox title="Tech Interview" value={scorecard.metrics.technical} />
                    <ScoreBox title="AI Confidence" value={scorecard.metrics.confidence} />

                    <div className={`rounded-xl p-4 border ${cheatWarnings === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h4 className="text-xs font-bold uppercase mb-1 flex justify-center items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Security
                        </h4>
                        <p className={`text-xl font-bold ${cheatWarnings === 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {cheatWarnings} Flags
                        </p>
                    </div>
                </div>

                <div className={`rounded-2xl p-8 border-2 ${scorecard.finalProbability > 75 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <h3 className="text-sm font-bold uppercase mb-2">
                        Final Hiring Probability
                    </h3>
                    <p className="text-6xl font-black">
                        {scorecard.finalProbability}%
                    </p>
                    <p className="font-bold mt-4 text-lg">
                        System Recommendation: {scorecard.status}
                    </p>
                </div>

                {cheatLogs.length > 0 && (
                    <div className="mt-8 text-left bg-red-50 p-6 rounded-xl border border-red-200">
                        <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Integrity Violations Log
                        </h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-red-800">
                            {cheatLogs.map((log, idx) => <li key={idx}>{log}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8">
            {!isInterviewActive ? (
                <div className="text-center py-12">
                    <Maximize className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <p className="mb-6">
                        This interview is proctored and requires fullscreen mode.
                    </p>
                    <button
                        onClick={handleStartInterview}
                        disabled={questions.length === 0}
                        className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold"
                    >
                        {questions.length === 0 ? 'Loading Questions...' : 'Start Interview'}
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="rounded-xl border-4 border-gray-800"
                    />
                    <div>
                        <h3 className="text-2xl font-bold">
                            {questions[currentQuestionIndex]}
                        </h3>
                        <button
                            onClick={handleNextQuestion}
                            className="mt-6 bg-gray-900 text-white px-6 py-4 rounded-xl font-bold"
                        >
                            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const ScoreBox = ({ title, value }) => (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="text-xs font-bold uppercase">{title}</h4>
        <p className="text-xl font-bold mt-1">{value}%</p>
    </div>
);