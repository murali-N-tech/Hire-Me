import { Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="bg-white border-b border-gray-100 shadow-sm fixed w-full z-50 top-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo Area */}
                    <Link to="/" className="flex items-center gap-2">
                        <BrainCircuit className="h-8 w-8 text-blue-600" />
                        <span className="font-extrabold text-2xl tracking-tight text-gray-900">
                            Hire<span className="text-blue-600">AI</span>
                        </span>
                    </Link>

                    {/* Navigation / Auth Buttons */}
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                            Log in
                        </Link>
                        <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition-colors shadow-md hover:shadow-lg">
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}