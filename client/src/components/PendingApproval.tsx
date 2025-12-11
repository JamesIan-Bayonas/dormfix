import React from 'react';
import { Clock, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from './UserContext';

export const PendingApproval: React.FC = () => {
    const { logout, user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center">
                <div className="bg-amber-500 p-6 flex justify-center">
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                        <Clock size={48} className="text-white" />
                    </div>
                </div>
                
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Pending</h2>
                    <p className="text-slate-600 mb-6">
                        Hello <strong>{user?.name}</strong>! You have successfully joined the dormitory queue. 
                        Your landlord needs to verify and approve your account before you can access the dashboard.
                    </p>

                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-left mb-6">
                        <div className="flex gap-3">
                            <ShieldAlert className="text-amber-500 shrink-0" size={20} />
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">What happens next?</h4>
                                <ul className="text-xs text-slate-500 list-disc list-inside mt-1 space-y-1">
                                    <li>Your landlord sees your request instantly.</li>
                                    <li>Once approved, you can log in to pay rent & request repairs.</li>
                                    <li>If you entered the wrong code, ask your landlord to reject it.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={logout}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Logout and Check Later
                    </button>
                </div>
            </div>
        </div>
    );
};