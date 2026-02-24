import { useState } from 'react';
import { uploadResume } from '../services/api';
import { FileText, CheckCircle, Briefcase, Building, Percent, Loader2 } from 'lucide-react';

export default function ResumeUpload({ onAnalysisComplete }) { // ✅ Accept prop here
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert("Please select a PDF first");

        setLoading(true);
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await uploadResume(formData);
            setResult(response.data.data);

            // ✅ NEW: Send predicted role up to Dashboard
            if (onAnalysisComplete) {
                onAnalysisComplete(response.data.data);
            }

        } catch (error) {
            console.error(error);
            alert("Error parsing resume");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            
            {/* ================= Upload Section ================= */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-3 rounded-lg">
                        <FileText className="text-blue-600 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Module 1: AI Resume Parser
                    </h2>
                </div>

                <form
                    onSubmit={handleUpload}
                    className="flex flex-col sm:flex-row gap-4 items-center"
                >
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 
                                   file:mr-4 file:py-3 file:px-4 
                                   file:rounded-full file:border-0 
                                   file:text-sm file:font-semibold 
                                   file:bg-blue-50 file:text-blue-700 
                                   hover:file:bg-blue-100 cursor-pointer 
                                   border border-gray-200 rounded-full"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 
                                   rounded-full font-bold hover:bg-blue-700 
                                   disabled:opacity-70 flex justify-center 
                                   items-center min-w-[160px] transition-all"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Analyze PDF'
                        )}
                    </button>
                </form>
            </div>


            {/* ================= Results Section ================= */}
            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* ---------- Score Overview ---------- */}
                    <div className="grid md:grid-cols-2 gap-6">
                        
                        {/* Role Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                            <h3 className="text-blue-100 font-medium mb-1">
                                AI Determined Role Fit
                            </h3>
                            <p className="text-3xl font-extrabold capitalize">
                                {result.predictedRole}
                            </p>
                            <div className="mt-4 inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-sm">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Model Prediction Confirmed
                            </div>
                        </div>

                        {/* ATS Score */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="text-gray-500 font-medium mb-1">
                                    ATS Compatibility Score
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Based on keyword density & structure
                                </p>
                            </div>
                            <div className="relative w-20 h-20 flex items-center justify-center bg-green-50 rounded-full border-4 border-green-500">
                                <span className="text-2xl font-bold text-green-700">
                                    {result.atsScore}%
                                </span>
                            </div>
                        </div>
                    </div>


                    {/* ---------- Company Recommendations ---------- */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Briefcase className="text-indigo-600" />
                            Module 2: Top Company Matches
                        </h3>

                        <div className="grid md:grid-cols-3 gap-4">
                            {result.recommendations.map((rec, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-100 rounded-xl p-5 
                                               hover:border-blue-300 hover:shadow-md 
                                               transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                                            <Building className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                                        </div>
                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                            <Percent className="w-3 h-3 mr-1" />
                                            {rec.match}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900">
                                        {rec.name}
                                    </h4>

                                    <p className="text-sm text-blue-600 font-medium mt-1">
                                        {rec.role}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider">
                                        {rec.type}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}