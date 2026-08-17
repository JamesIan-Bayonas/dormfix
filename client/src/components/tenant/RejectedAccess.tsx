// client/src/components/tenant/RejectedAccess.tsx
import React, { useState } from 'react';
import { XCircle, LogOut, Key, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../UserContext';
import toast from 'react-hot-toast';

interface Props {
    onRelinkSuccess: () => void;
}

export const RejectedAccess: React.FC<Props> = ({ onRelinkSuccess }) => {
    const { user, logout } = useAuth();
    const [landlordCode, setLandlordCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRelink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !landlordCode.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/tenant/relink`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: user.id,
                    landlordCode: landlordCode.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to re-link property code.');

            toast.success("Successfully applied with new Landlord Code!");
            onRelinkSuccess();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9f5] flex flex-col justify-center items-center p-6 font-sans text-slate-800 animate-fade-in">
            <div className="max-w-md w-full bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8 text-center space-y-6">
                
                {/* REJECTION ICON INDICATOR */}
                <div className="flex justify-center pt-2">
                    <div className="bg-red-50 border border-red-100 p-5 rounded-full shadow-xs text-red-600">
                        <XCircle size={40} strokeWidth={2} />
                    </div>
                </div>
                
                {/* STATUS SUMMARY */}
                <div>
                    <h2 className="text-3xl font-serif text-slate-800 tracking-tight">Application Unlinked</h2>
                    <p className="text-slate-500 text-xs font-medium mt-2 leading-relaxed">
                        Hello <span className="font-bold text-slate-700">{user?.name}</span>. Your previous access request was declined or removed by property administration.
                    </p>
                </div>

                {/* ADVISORY BOX */}
                <div className="bg-[#fff7f7] rounded-2xl p-4 border border-[#fce8e8] text-left">
                    <div className="flex gap-2.5">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-red-700 font-medium leading-relaxed">
                            If you believe this was an error, re-enter the property code provided by your landlord, or obtain a new code.
                        </p>
                    </div>
                </div>

                {/* RE-LINK FORM */}
                <form onSubmit={handleRelink} className="space-y-4 text-left">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            New Landlord / Dorm Code
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3.5 top-3.5 text-slate-400" size={15} />
                            <input 
                                type="text" 
                                required
                                value={landlordCode}
                                onChange={(e) => setLandlordCode(e.target.value)}
                                placeholder="#8821" 
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-[#f8f9f5] focus:bg-white focus:ring-1 focus:ring-[#425042] text-xs font-mono tracking-wider uppercase outline-none transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-600 font-semibold">{error}</p>
                    )}

                    <button 
                        type="submit" 
                        disabled={isSubmitting || !landlordCode.trim()}
                        className="w-full py-3 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                        {isSubmitting ? 'Linking...' : <>Apply with New Code <ArrowRight size={14} /></>}
                    </button>
                </form>

                {/* SIGN OUT ACTION */}
                <div className="pt-2 border-t border-gray-100">
                    <button 
                        onClick={logout}
                        className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                    </button>
                </div>
                
            </div>
        </div>
    );
};