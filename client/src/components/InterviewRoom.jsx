import { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { analyzeFrame, getQuestions, evaluateAnswer } from '../services/api';
import {
    Video,
    AlertTriangle,
    ShieldAlert,
    Maximize,
    Mic,
    MicOff,
    Loader2
} from 'lucide-react';

// Convert webcam base64 → File
const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(',');
    let mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
};

export default function InterviewRoom({ role, atsScore }) {
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

    // ==========================================
    // 1️⃣ Browser Proctoring
    // ==========================================
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

    // ==========================================
    // 2️⃣ Fetch Questions
    // ==========================================
    useEffect(() => {
        const fetchQuestions = async () => {
            if (!role) return;
            try {
                const res = await getQuestions(role);
                setQuestions(res.data.data);
            } catch (error) {
                console.error("Failed to load questions", error);
            }
        };
        fetchQuestions();
    }, [role]);

    // ==========================================
    // 3️⃣ Text-to-Speech
    // ==========================================
    const speakQuestion = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    // ==========================================
    // 4️⃣ Speech-to-Text Setup (UPDATED BUG FIX)
    // ==========================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = true;
        recognition.interimResults = true;
        
        // 🔥 FIX: Overwrite transcript completely on every event instead of appending
        recognition.onresult = (event) => {
            let fullTranscript = '';
            // Loop from 0 to capture the absolute finalized string of the whole session
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            setTranscript(fullTranscript); 
        };
    }

    const toggleListening = () => {
        if (!recognition)
            return alert("Speech Recognition supported only in Chrome.");

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            setTranscript("");
            recognition.start();
            setIsListening(true);
        }
    };

    // ==========================================
    // 5️⃣ Start Interview
    // ==========================================
    const handleStartInterview = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (err) {
            console.warn(err);
        }

        setIsInterviewActive(true);
        if (questions.length > 0) speakQuestion(questions[0]);
    };

    // ==========================================
    // 6️⃣ Submit & Grade Answer
    // ==========================================
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
            setTechScores(prev => [...prev, 60]);
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

    // ==========================================
    // 7️⃣ Finish Interview
    // ==========================================
    const finishInterview = () => {
        setIsInterviewActive(false);
        if (document.fullscreenElement) document.exitFullscreen();

        const avgConf =
            confidenceScores.length > 0
                ? confidenceScores.reduce((a, b) => a + b, 0) /
                  confidenceScores.length
                : 50;

        const avgTech =
            techScores.length > 0
                ? techScores.reduce((a, b) => a + b, 0) / techScores.length
                : 75;

        const resumeScore = Number(atsScore) || 75;
        const penalty = Math.min(cheatWarnings * 5, 20);

        const finalProb = Math.max(
            resumeScore * 0.4 +
                avgTech * 0.35 +
                avgConf * 0.25 -
                penalty,
            0
        );

        setScorecard({
            metrics: {
                resume: resumeScore.toFixed(1),
                technical: avgTech.toFixed(1),
                confidence: avgConf.toFixed(1)
            },
            finalProbability: finalProb.toFixed(1),
            status:
                finalProb > 75
                    ? "Highly Recommended"
                    : "Requires Improvement"
        });

        setIsComplete(true);
    };

    // ==========================================
    // 8️⃣ Vision AI Frame Capture
    // ==========================================
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
                const { emotion, confidence_score, proctoring_flag } =
                    response.data.data;

                setCurrentEmotion(emotion);

                if (confidence_score > 0)
                    setConfidenceScores(prev => [
                        ...prev,
                        confidence_score
                    ]);

                if (proctoring_flag && proctoring_flag !== "Clear")
                    recordViolation(`Vision AI: ${proctoring_flag}`);
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
    // FINAL RESULT UI
    // ==========================================
    if (isComplete && scorecard) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow mt-8 text-center">
                <h2 className="text-3xl font-bold mb-6">
                    Final Evaluation Complete
                </h2>

                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <ScoreBox title="Resume" value={scorecard.metrics.resume} />
                    <ScoreBox title="Technical" value={scorecard.metrics.technical} />
                    <ScoreBox title="Confidence" value={scorecard.metrics.confidence} />
                    <ScoreBox title="Security Flags" value={cheatWarnings} />
                </div>

                <div className="p-8 rounded-xl border">
                    <h3 className="text-sm uppercase mb-2">
                        Final Hiring Probability
                    </h3>
                    <p className="text-6xl font-black">
                        {scorecard.finalProbability}%
                    </p>
                    <p className="font-bold mt-4">
                        {scorecard.status}
                    </p>
                </div>

                {cheatLogs.length > 0 && (
                    <div className="mt-6 text-left bg-red-50 p-4 rounded">
                        <h4 className="font-bold mb-2">
                            <AlertTriangle className="inline w-4 h-4 mr-1" />
                            Violations
                        </h4>
                        <ul className="text-sm list-disc pl-5">
                            {cheatLogs.map((log, idx) => (
                                <li key={idx}>{log}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // INTERVIEW SCREEN
    // ==========================================
    return (
        <div className="bg-white p-8 rounded-2xl shadow mt-8">
            {!isInterviewActive ? (
                <div className="text-center py-12">
                    <Maximize className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                    <p className="mb-6">
                        This interview is proctored and requires fullscreen.
                    </p>
                    <button
                        onClick={handleStartInterview}
                        disabled={questions.length === 0}
                        className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold"
                    >
                        Start Interview
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
                        <h3 className="text-2xl font-bold mb-4">
                            {questions[currentQuestionIndex]}
                        </h3>

                        <div className="bg-gray-50 p-4 rounded mb-4 min-h-[120px]">
                            {transcript || "Your answer will appear here..."}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={toggleListening}
                                className="flex-1 bg-blue-100 py-3 rounded"
                            >
                                {isListening ? "Stop" : "Start"} Recording
                            </button>

                            <button
                                onClick={handleNextQuestion}
                                disabled={isEvaluating || transcript.trim() === ""}
                                className="flex-1 bg-black text-white py-3 rounded"
                            >
                                {isEvaluating ? (
                                    <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                                ) : currentQuestionIndex <
                                  questions.length - 1 ? (
                                    "Submit & Next"
                                ) : (
                                    "Finish"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const ScoreBox = ({ title, value }) => (
    <div className="bg-gray-50 rounded-xl p-4 border">
        <h4 className="text-xs uppercase">{title}</h4>
        <p className="text-xl font-bold mt-1">{value}%</p>
    </div>
);