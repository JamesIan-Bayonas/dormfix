// client/src/components/Login.tsx
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Home, ArrowRight } from 'lucide-react';
import { useAuth } from './UserContext';

interface LoginProps {
    onToggleRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onToggleRegister }) => {
    const { login, isLoading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, password); 
    };

    return (
        <div className="min-h-screen flex w-full bg-[#f8f9f5] font-sans text-slate-800 animate-fade-in">
            
            {/* LEFT SIDE: MATTE OLIVE BRAND HERO */}
            <div className="hidden lg:flex w-1/2 relative justify-center items-center bg-[#425042]">
                
                {/* Background Image with Muted Tone-Matched Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80" 
                        alt="Dormitory Building" 
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#425042]/95 via-[#344034]/90 to-[#566556]/60 mix-blend-multiply" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 p-12 text-center max-w-lg space-y-6">
                    <div className="mx-auto bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl w-16 h-16 flex items-center justify-center shadow-xl">
                        <Home size={32} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-serif text-white tracking-tight drop-shadow-sm">
                        DormFix
                    </h1>
                    <p className="text-base text-[#bac3ba] font-light leading-relaxed">
                        Streamlining student housing with efficiency, transparency, and accountability.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: THE LOGIN CREDENTIALS FORM */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 bg-transparent">
                <div className="w-full max-w-sm space-y-8">
                    
                    {/* Header Typography Section */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-serif text-slate-800 tracking-tight">Welcome Back</h2>
                        <p className="mt-1.5 text-xs text-slate-400 font-medium">
                            Enter your credentials to access your dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div className="space-y-4">
                            
                            {/* Email Input Field */}
                            <div>
                                <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-gray-400 group-focus-within:text-[#657655] transition-colors" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium
                                        bg-white focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none shadow-xs"
                                        placeholder="you@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Input Field */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <a href="#" className="text-[11px] font-semibold text-[#5c6e4e] hover:text-[#425042] transition-colors">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock size={16} className="text-gray-400 group-focus-within:text-[#657655] transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium
                                        bg-white focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none shadow-xs"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer outline-none"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Error Handling Box Output */}
                        {error && (
                            <div className="flex items-center p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 animate-in fade-in zoom-in-95 duration-150">
                                <AlertCircle size={16} className="mr-2.5 flex-shrink-0" />
                                <p className="text-xs font-semibold">{error}</p>
                            </div>
                        )}

                        {/* Submission Trigger Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm 
                            text-xs font-bold tracking-wider uppercase text-white bg-[#425042] hover:bg-[#344034]
                            focus:outline-none transition-all disabled:opacity-50 select-none cursor-pointer"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    Sign In <ArrowRight size={14} />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Footer Nav Links */}
                    <div className="mt-8 text-center pt-4 border-t border-gray-200/40">
                        <p className="text-xs text-slate-400 font-medium">
                            Don't have an account?{' '}
                            <button 
                                onClick={onToggleRegister} 
                                className="font-bold text-[#5c6e4e] hover:text-[#425042] hover:underline transition-colors outline-none"
                            >
                                Create an account
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;