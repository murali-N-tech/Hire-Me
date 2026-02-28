import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume } from '../services/api';
import { 
    FileText, CheckCircle, Loader2, AlertTriangle, 
    ArrowRight, Target, UploadCloud, X, Briefcase, FileCheck2 
} from 'lucide-react';

export default function ResumeUpload() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    // States
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);

    // ==========================================
    // Drag & Drop Handlers
    // ==========================================
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        setError("");

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                setFile(droppedFile);
            } else {
                setError("Invalid file type. Please upload a PDF.");
            }
        }
    };

    const handleFileSelect = (e) => {
        setError("");
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
            } else {
                setError("Invalid file type. Please upload a PDF.");
            }
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ==========================================
    // Submission Logic
    // ==========================================
    const handleUpload = async (e) => {
        e.preventDefault();
        setError("");
        
        if (!file) return setError("Please upload your resume (PDF).");
        if (!jobDescription.trim()) return setError("Please paste the target Job Description.");

        setLoading(true);
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jobDescription);

        try {
            const response = await uploadResume(formData);
            setResult(response.data.data);
        } catch (error) {
            console.error(error);
            setError("Error analyzing resume. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const proceedToInterview = () => {
        navigate('/interview', { 
            state: { 
                role: result?.predictedRole || 'Developer', 
                atsScore: result?.atsScore || 75 
            } 
        });
    };

    return (
        <div className="max-w-6xl mx-auto mt-10 p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4 text-blue-600">
                    <Briefcase className="w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">AI Candidate Screening</h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
                    Match your resume against the job description. Our enterprise NLP engine will calculate your ATS compatibility before the technical evaluation.
                </p>
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                {error && (
                    <div className="mx-8 mt-8 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" /> 
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleUpload} className="p-8 lg:p-12 relative z-10 grid lg:grid-cols-2 gap-12">
                    
                    {/* LEFT: Job Description */}
                    <div className="space-y-4 flex flex-col h-full">
                        <label className="flex items-center gap-2 text-sm font-black text-gray-800 uppercase tracking-widest">
                            <Target className="w-5 h-5 text-blue-500" /> Target Job Description
                        </label>
                        <p className="text-sm text-gray-500 mb-2">Paste the exact requirements, skills, and responsibilities for the role you are applying for.</p>
                        <textarea 
                            className="w-full flex-1 min-h-[250px] p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-700 resize-none leading-relaxed shadow-inner"
                            placeholder="e.g. We are looking for a Senior React Developer with 5+ years of experience in MERN stack, Tailwind CSS, and cloud architecture..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                    </div>

                    {/* RIGHT: Drag & Drop Zone */}
                    <div className="space-y-4 flex flex-col h-full">
                        <label className="flex items-center gap-2 text-sm font-black text-gray-800 uppercase tracking-widest">
                            <FileText className="w-5 h-5 text-blue-500" /> Resume Upload (PDF)
                        </label>
                        <p className="text-sm text-gray-500 mb-2">Upload your latest resume. Our parser supports standard PDF formats.</p>
                        
                        <div 
                            className={`flex-1 relative flex flex-col items-center justify-center p-10 border-3 border-dashed rounded-3xl transition-all duration-300 ${
                                isDragging 
                                    ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg shadow-blue-500/20' 
                                    : file 
                                        ? 'border-green-400 bg-green-50' 
                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !file && fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                accept=".pdf" 
                                className="hidden" 
                                onChange={handleFileSelect}
                            />
                            
                            {file ? (
                                <div className="text-center animate-in zoom-in-95">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                        <FileCheck2 className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 px-4">{file.name}</h3>
                                    <p className="text-sm text-gray-500 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                                    <button 
                                        type="button" 
                                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                        className="text-red-500 font-bold text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full flex items-center gap-2 mx-auto transition-colors"
                                    >
                                        <X className="w-4 h-4" /> Remove File
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center cursor-pointer pointer-events-none">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-300 ${isDragging ? 'bg-blue-200 text-blue-700' : 'bg-white text-gray-400 shadow-sm'}`}>
                                        <UploadCloud className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        {isDragging ? 'Drop your resume here!' : 'Click or drag to upload'}
                                    </h3>
                                    <p className="text-gray-500 text-sm font-medium">Maximum file size 5MB.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="lg:col-span-2 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !file || !jobDescription.trim()}
                            className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center min-w-[240px] transition-all shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-1"
                        >
                            {loading ? (
                                <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Analyzing Profile...</>
                            ) : (
                                <><Briefcase className="w-6 h-6 mr-3" /> Calculate ATS Score</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* ========================================== */}
            {/* RESULTS SECTION (Shows after analysis) */}
            {/* ========================================== */}
            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className={`border-2 rounded-[2rem] p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden ${
                        result.atsScore >= 60 
                            ? 'bg-gradient-to-br from-green-50 via-white to-emerald-50 border-green-200' 
                            : 'bg-gradient-to-br from-red-50 via-white to-orange-50 border-red-200'
                    }`}>
                        
                        <div className="flex-1 relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                {result.atsScore >= 60 ? (
                                    <div className="bg-green-100 p-2 rounded-full"><CheckCircle className="text-green-600 w-6 h-6" /></div>
                                ) : (
                                    <div className="bg-red-100 p-2 rounded-full"><AlertTriangle className="text-red-600 w-6 h-6" /></div>
                                )}
                                <h3 className="text-2xl font-black text-gray-900">Analysis Complete</h3>
                            </div>
                            
                            <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-xl">
                                {result.atsScore >= 60 
                                    ? `Excellent match! Your resume aligns well with the ${result.predictedRole || 'target'} requirements. You are cleared to proceed to the technical evaluation.` 
                                    : 'Your match score is below the recommended threshold. You may proceed, but expect the AI interviewer to test you heavily on missing skills.'}
                            </p>
                            
                            <div className="flex gap-4">
                                <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex-1 max-w-[200px]">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Keyword Match</p>
                                    <p className="font-black text-2xl text-gray-900">{result.keywordScore}%</p>
                                </div>
                                <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex-1 max-w-[200px]">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Semantic Sim.</p>
                                    <p className="font-black text-2xl text-gray-900">{result.similarityScore}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-6 relative z-10 w-full md:w-auto">
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Overall ATS Score</p>
                                <div className={`relative w-40 h-40 flex items-center justify-center rounded-full border-[12px] bg-white shadow-xl ${
                                    result.atsScore >= 60 ? 'border-green-500 text-green-600 shadow-green-500/20' : 'border-red-500 text-red-600 shadow-red-500/20'
                                }`}>
                                    <span className="text-5xl font-black">{result.atsScore}%</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={proceedToInterview}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-1 text-lg group"
                            >
                                Enter Interview Room <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}