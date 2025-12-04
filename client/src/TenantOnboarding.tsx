import React, { useState } from 'react';
import { Home, Key, ArrowRight, CheckCircle } from 'lucide-react';

export const TenantOnboarding: React.FC<{ onJoin: () => void }> = ({ onJoin }) => {
    const [code, setCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsJoining(true);

        // SIMULATION: In real backend, this POSTs to /api/join-dorm
        setTimeout(() => {
            alert(`Successfully joined dorm with code: ${code}`);
            setIsJoining(false);
            onJoin(); // Triggers the parent to switch to "Dashboard Mode"
        }, 1000);
    };

    return (
        <div className="min-h-[80vh] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Hero Section */}
                <div className="bg-emerald-900 p-8 text-center">
                    <div className="mx-auto bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
                        <Home className="text-emerald-300" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Find Your Dorm</h2>
                    <p className="text-emerald-200 mt-2 text-sm">
                        Enter the unique code provided by your landlord to access your dashboard.
                    </p>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    <form onSubmit={handleJoin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Landlord / Dorm Code
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input 
                                    type="text" 
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="#8821" 
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 transition-colors text-lg font-mono tracking-wider placeholder:font-sans"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isJoining}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isJoining ? (
                                'Verifying...'
                            ) : (
                                <>Join Dormitory <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">How it works</h4>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex gap-2">
                                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                <span>Get the code directly from your Landlord.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                <span>Your account will be instantly linked.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                <span>Start reporting issues and paying rent.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};