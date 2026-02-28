import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, LogOut, LayoutDashboard, User } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-blue-600 p-2 rounded-xl group-hover:bg-blue-700 transition-colors">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                            HireAI
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            // Showing when LOGGED IN
                            <>
                                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                                </Link>
                                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                    <User className="w-4 h-4 text-blue-500" />
                                    {user?.name || 'User'}
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="text-red-600 hover:bg-red-50 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </>
                        ) : (
                            // Showing when LOGGED OUT
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2 rounded-lg transition-colors">
                                    Log in
                                </Link>
                                <Link to="/register" className="bg-blue-600 text-white hover:bg-blue-700 font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200 hover:shadow-md hover:-translate-y-0.5">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}