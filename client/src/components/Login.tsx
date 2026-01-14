// src/components/Login.tsx
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
        // Added 'font-sans' here to apply Inter globally
        <div className="min-h-screen flex w-full bg-white overflow-hidden font-sans">
            
            {/* LEFT SIDE: The Brand Hero */}
            <div className="hidden lg:flex w-1/2 relative justify-center items-center bg-emerald-950">
                
                {/* Background Image with Modern Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80" 
                        alt="Dormitory Building" 
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-emerald-800/80 to-emerald-600/60 mix-blend-multiply" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 p-12 text-center max-w-lg">
                    <div className="mx-auto bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl w-20 h-20 flex items-center justify-center mb-8 shadow-2xl">
                        <Home size={40} className="text-white" />
                    </div>
                    {/* font-display applies Plus Jakarta Sans */}
                    <h1 className="text-5xl font-display font-bold text-white mb-6 tracking-tight drop-shadow-lg">
                        DormFix
                    </h1>
                    <p className="text-xl text-emerald-50 font-light leading-relaxed opacity-90">
                        Streamlining student housing with efficiency, transparency, and accountability.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: The Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 bg-white">
                <div className="w-full max-w-md space-y-8">
                    
                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Welcome Back</h2>
                        <p className="mt-2 text-gray-500">
                            Enter your credentials to access your dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-5">
                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-display font-semibold text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 
                                        bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 
                                        transition-all duration-200 outline-none sm:text-sm"
                                        placeholder="you@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="password" className="block text-sm font-display font-semibold text-gray-700">
                                        Password
                                    </label>
                                    <a href="#" className="text-xs font-medium text-emerald-600 hover:text-emerald-500">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 
                                        bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 
                                        transition-all duration-200 outline-none sm:text-sm"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                                <AlertCircle size={18} className="mr-3 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 
                            text-sm font-display font-bold text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/30
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 
                            transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    Sign In <ArrowRight size={16} className="ml-2" />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center border-t border-gray-100 pt-6">
                        <p className="text-sm text-gray-500">
                            Don't have an account?{' '}
                            <button 
                                onClick={onToggleRegister} 
                                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline"
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