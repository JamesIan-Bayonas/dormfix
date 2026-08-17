// client/src/TenantOnboarding.tsx
import React, { useState } from 'react';
import { Home, Key, ArrowRight, CheckSquare, AlertCircle } from 'lucide-react';
import { useAuth } from './components/UserContext';
import toast from 'react-hot-toast';

export const TenantOnboarding: React.FC<{ onJoin: () => void }> = ({ onJoin }) => {
    const { user } = useAuth();
    const [code, setCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user?.id) {
            setError("Active session not found. Please log in again.");
            return;
        }

        if (!code.trim()) {
            setError("Please enter a valid landlord identifier token.");
            return;
        }

        setIsJoining(true);
        setError(null);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/tenant/relink`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: user.id,
                    landlordCode: code.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to link property identifier token.");
            }

            toast.success("Property linkage verified successfully!");
            onJoin();
        } catch (err: any) {
            const errorMessage = err.message || "An unexpected error occurred during property linkage.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9f5] flex flex-col justify-center items-center p-6 font-sans text-slate-800 animate-fade-in">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                
                {/* INSTITUTIONAL HEADER */}
                <div className="bg-[#425042] px-8 py-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/10 w-14 h-14 rounded-sm flex items-center justify-center backdrop-blur-sm mb-5 border border-white/20">
                            <Home className="text-[#e7efdb]" size={28} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-3xl font-serif text-white tracking-tight">Property Linkage</h2>
                        <p className="text-[#bac3ba] mt-2 text-xs font-medium tracking-wide">
                            Provide your structural assignment token.
                        </p>
                    </div>
                </div>

                {/* LEDGER INPUT SECTION */}
                <div className="p-8 space-y-8 bg-white">
                    <form onSubmit={handleJoin} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                System Identifier Token
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3.5 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="#8821" 
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-none bg-[#f8f9f5] focus:bg-white focus:border-[#425042] focus:ring-1 focus:ring-[#425042] transition-colors text-sm font-mono tracking-widest text-slate-800 uppercase outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* ERROR FEEDBACK */}
                        {error && (
                            <div className="flex items-start p-3 bg-[#fff7f7] border border-[#fce8e8] text-[#cc4747] rounded-sm text-xs font-semibold gap-2 animate-in fade-in">
                                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isJoining || !code.trim()}
                            className="w-full py-3.5 bg-[#425042] hover:bg-[#344034] text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none"
                        >
                            {isJoining ? (
                                'Verifying Token...'
                            ) : (
                                <>Execute Linkage <ArrowRight size={14} /></>
                            )}
                        </button>
                    </form>

                    {/* PROTOCOL LIST */}
                    <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Standard Operating Procedure
                        </h4>
                        <ul className="text-xs text-slate-600 space-y-3 font-medium">
                            <li className="flex gap-3 items-start">
                                <CheckSquare size={14} className="text-[#5c6e4e] shrink-0 mt-0.5" />
                                <span>Obtain physical or digital identifier from your property administrator.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckSquare size={14} className="text-[#5c6e4e] shrink-0 mt-0.5" />
                                <span>Database linkage executes instantly upon verification.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckSquare size={14} className="text-[#5c6e4e] shrink-0 mt-0.5" />
                                <span>Gain clearance to file audits and maintenance reports.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};