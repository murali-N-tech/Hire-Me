import { useState } from 'react';
import { uploadResume } from '../services/api';
import { FileText, CheckCircle, Briefcase, Percent, Loader2, AlertTriangle } from 'lucide-react';

export default function ResumeUpload({ onAnalysisComplete }) {
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async (e) => {
        e.preventDefault();
        setError("");
        
        if (!file) return setError("Please select a PDF first");
        if (!jobDescription.trim()) return setError("Please paste the Job Description");

        setLoading(true);
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jobDescription);

        try {
            const response = await uploadResume(formData);
            setResult(response.data.data);

            if (onAnalysisComplete) {
                onAnalysisComplete(response.data.data);
            }
        } catch (error) {
            console.error(error);
            setError("Error analyzing resume. Make sure both servers are running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-3 rounded-lg">
                        <FileText className="text-blue-600 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        AI Resume & JD Analyzer
                    </h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> {error}
                    </div>
                )}

                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Job Description</label>
                        <textarea 
                            rows="4"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Paste the job requirements here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-200 rounded-full"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 disabled:opacity-70 flex justify-center items-center min-w-[160px] transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze Match'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results Section */}
            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* ATS Score Gatekeeper */}
                        <div className={`border rounded-2xl p-6 shadow-sm flex items-center justify-between ${result.atsScore >= 60 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div>
                                <h3 className="font-bold mb-1 text-gray-900">
                                    ATS Match Score
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {result.atsScore >= 60 ? 'Strong match! Ready for interview.' : 'Low match. Consider tailoring your resume.'}
                                </p>
                            </div>
                            <div className={`relative w-20 h-20 flex items-center justify-center rounded-full border-4 ${result.atsScore >= 60 ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}`}>
                                <span className="text-2xl font-bold">{result.atsScore}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}