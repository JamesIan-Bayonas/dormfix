// client/src/components/tenant/PendingApproval.tsx
import React from 'react';
import { Clock, LogOut, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../UserContext';

export const PendingApproval: React.FC = () => {
    const { logout, user } = useAuth();

    return (
        <div className="min-h-screen bg-[#f8f9f5] flex flex-col justify-center items-center p-6 font-sans text-slate-800 animate-fade-in">
            <div className="max-w-md w-full bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8 text-center space-y-6">
                
                {/* REFINED TIMING CIRCLE INDICATOR */}
                <div className="flex justify-center pt-2">
                    <div className="bg-[#fef9eb] border border-[#f5ead0] p-5 rounded-full shadow-xs text-[#b97a26] animate-pulse">
                        <Clock size={40} strokeWidth={2} />
                    </div>
                </div>
                
                {/* EDITORIAL TYPOGRAPHY SUMMARY */}
                <div>
                    <h2 className="text-3xl font-serif text-slate-800 tracking-tight">Access Pending</h2>
                    <p className="text-slate-500 text-xs font-medium mt-2 leading-relaxed">
                        Hello <span className="font-bold text-slate-700">{user?.name}</span>! You have successfully joined the dormitory queue. Your landlord needs to verify and authorize your account profile before you can access the dashboard.
                    </p>
                </div>

                {/* NEXT STEPS GUIDE BOX */}
                <div className="bg-[#f8f9f5] rounded-2xl p-5 border border-gray-200/60 text-left">
                    <div className="flex gap-3">
                        <ShieldAlert className="text-[#b97a26] shrink-0 mt-0.5" size={18} />
                        <div>
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500">What happens next?</h4>
                            <ul className="text-xs text-slate-600 list-disc list-inside mt-2.5 space-y-1.5 font-medium leading-relaxed">
                                <li>Your landlord sees your pending request instantly.</li>
                                <li>Once approved, you can log in to pay rent & request repairs.</li>
                                <li>If you entered the wrong code, ask your landlord to reject it.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* PRIMARY ACTIONS LOGOUT TRIGGER BUTTON */}
                <button 
                    onClick={logout}
                    className="w-full py-3 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold tracking-wider uppercase rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 outline-none select-none cursor-pointer"
                >
                    <LogOut size={14} />
                    <span>Logout and Check Later</span>
                    <ArrowRight size={14} className="ml-1 opacity-60" />
                </button>
                
            </div>
        </div>
    );
};