// src/App.tsx
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Users, AlertCircle, Home, User as UserIcon } from 'lucide-react';
import { useAuth } from './components/UserContext';
import { TenantDashboard, LandlordDashboard } from './components/DashBoards'; 
import type { UserRole } from './types/types';

const LoginPage: React.FC = () => {
    // Destructure all necessary state and functions from the updated useAuth hook
    const { user, login, isLoading, error } = useAuth();
    
    // Local state for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword  ] = useState('');
    const [role, setRole] = useState<UserRole>('tenant');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Call the updated login function
        login(email, password, role); 
    };

    // ===============================================================
    // LOGIN FORM VIEW (Centered Card Layout - Matching the image)
    // ===============================================================
    return (
        // 1. Main container: Fills screen, centers content, set light gray background.
        // ⭐ FIXED: Added "w-full" to eliminate black area on the right
        <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-50 p-4"> 
            
            {/* Top Logo and Motto (Matching Image Style) */}
            <div className="text-center mb-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-300">
                    <Home size={32} className="text-white" />
                </div>
                <h1 className="mt-4 text-3xl font-bold text-slate-900">DormFix</h1>
                <p className="text-sm text-slate-500 font-light">
                    Efficiency, Transparency, and Accountability
                </p>
            </div>

            {/* Login Card/Panel */}
            <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                
                {/* Login/Register Tabs (Mimicking the image) */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6 shadow-inner">
                    <button className="w-1/2 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow">Login</button>
                    <button className="w-1/2 py-2 text-sm font-semibold text-slate-500">Register</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-slate-50 focus:bg-white"
                                    placeholder="tenant@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-slate-50 focus:bg-white"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                    </div>
                    
                    {/* Error Message Display */}
                    {error && (
                        <div className="flex items-center p-3 rounded-lg bg-red-50 border border-red-300 text-red-700">
                            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            "Login to DormFix"
                        )}
                    </button>
                </form>

                {/* Hint text (Demo Accounts - Matching image style) */}
                <div className='text-xs text-left text-slate-500 bg-indigo-50 border border-indigo-200 p-3 rounded-lg mt-6'>
                    <p className="mb-1 font-semibold text-slate-800 flex items-center gap-1"><UserIcon size={14} /> Demo Accounts:</p>
                    <p className="ml-5">Tenant: <strong className="text-slate-700">tenant@dormfix.com</strong> (Pass: tenantpass)</p>
                    <p className="ml-5">Landlord: <strong className="text-slate-700">landlord@dormfix.com</strong> (Pass: adminpass)</p>
                </div>

            </div> 
        </div>
    );
};

const App: React.FC = () => {
    const { user } = useAuth();

    if (user) {
        if (user.role === 'tenant') {
            return <TenantDashboard />;
        }
        if (user.role === 'landlord') {
            return <LandlordDashboard />;
        }
    }

    return <LoginPage />;
}

export default App;