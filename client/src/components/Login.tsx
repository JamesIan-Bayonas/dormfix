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
        <div className="h-screen w-full flex bg-[#f8f9f5] font-sans text-slate-800 animate-fade-in overflow-hidden">
            
            {/* LEFT SIDE: PINNED BRAND HERO */}
            <div className="hidden lg:flex w-1/2 h-screen sticky top-0 justify-center items-center bg-[#425042] overflow-hidden shrink-0">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80" 
                        alt="Dormitory Architecture" 
                        className="w-full h-full object-cover opacity-25 mix-blend-luminosity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#425042]/95 via-[#344034]/95 to-[#2f3727]/80 mix-blend-multiply" />
                </div>

                <div className="relative z-10 p-12 text-center max-w-lg space-y-5">
                    <div className="mx-auto bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-xl w-14 h-14 flex items-center justify-center shadow-2xl">
                        <Home size={28} className="text-[#e7efdb]" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-serif text-white tracking-tight drop-shadow-sm">
                        DormFix
                    </h1>
                    <p className="text-xs text-[#bac3ba] font-medium leading-relaxed tracking-wide">
                        Streamlining dormitory management, rent tracking, and maintenance.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: INDEPENDENTLY SCROLLABLE & COMPACT FORM */}
            <div className="w-full lg:w-1/2 h-screen overflow-y-auto custom-scrollbar flex flex-col justify-between items-center px-6 py-6 sm:px-12 bg-transparent">
                <div className="w-full max-w-sm my-auto space-y-6 py-2">
                    
                    <div className="text-center lg:text-left border-b border-gray-200/60 pb-3">
                        <h2 className="text-2xl font-serif text-slate-800 tracking-tight">Welcome Back</h2>
                        <p className="mt-1 text-xs text-slate-400 font-medium">
                            Enter your credentials to access your dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3.5">
                            
                            {/* EMAIL INPUT */}
                            <div>
                                <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={15} className="text-gray-400 group-focus-within:text-[#5c6e4e] transition-colors" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-none bg-white text-xs text-slate-800 font-medium
                                        focus:bg-[#f8f9f5] focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* PASSWORD INPUT */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <a href="#" className="text-xs font-semibold text-[#5c6e4e] hover:text-[#425042] transition-colors outline-none">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={15} className="text-gray-400 group-focus-within:text-[#5c6e4e] transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-none bg-white text-xs text-slate-800 font-medium
                                        focus:bg-[#f8f9f5] focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none tracking-widest placeholder:tracking-normal"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-slate-600 cursor-pointer outline-none"
                                    >
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ERROR BOUNDARY */}
                        {error && (
                            <div className="flex items-start p-2.5 bg-[#fff7f7] border border-[#fce8e8] text-[#cc4747] animate-in fade-in zoom-in-95 duration-150 rounded-sm">
                                <AlertCircle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-xs font-semibold leading-tight">{error}</p>
                            </div>
                        )}

                        {/* SUBMISSION TRIGGER */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent 
                            text-xs font-bold tracking-wider uppercase text-white bg-[#425042] hover:bg-[#344034]
                            focus:outline-none transition-all disabled:opacity-50 select-none cursor-pointer rounded-sm"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing In...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    Sign In <ArrowRight size={14} />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* CLEAR & HUMAN FOOTER LINK */}
                    <div className="text-center pt-4 border-t border-gray-200/60">
                        <p className="text-xs text-slate-500 font-medium">
                            Don't have an account?{' '}
                            <button 
                                onClick={onToggleRegister} 
                                className="font-bold text-[#425042] hover:text-[#5c6e4e] hover:underline transition-colors outline-none cursor-pointer"
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