// client/src/components/dashboards/TenantDashboard.tsx
import { MessageSquare, Home, LogOut, Wrench, CreditCard, X, User, Calendar, Mail, ArrowRight } from 'lucide-react'; 
import { TenantChat } from '../tenant/TenantChat';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../UserContext';
import { MaintenanceList } from '../MaintenanceList';
import { TenantPaymentForm } from '../tenant/TenantPaymentForm'; 
import { TenantPaymentHistory } from '../tenant/TenantPaymentHistory';

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

interface HousingDetails {
    landlordId: string;
    landlordName: string;
    landlordEmail: string;
    roomNumber: string;
    moveInDate: string;
}

export const TenantDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    
    const navigate = useNavigate();
    const location = useLocation();

    const activeModal = location.pathname.includes('/pay') ? 'payment' : location.pathname.includes('/report') ? 'maintenance' : null;

    const [housing, setHousing] = useState<HousingDetails | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isLoadingHousing, setIsLoadingHousing] = useState(true);
    
    const [formData, setFormData] = useState({
        issueType: 'Plumbing',
        urgency: 'Low',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user?.id) {
            setIsLoadingHousing(true);
            fetch(`http://localhost:5000/api/tenant/details/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) {
                        setHousing(data);
                    }
                })
                .catch(err => {
                    console.error("Failed to load housing info", err);
                    toast.error("Failed to connect to server.");
                })
                .finally(() => setIsLoadingHousing(false)); 
        }
    }, [user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('http://localhost:5000/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: user?.id,
                    ...formData
                })
            });

            if (!res.ok) throw new Error("Submission failed");

            toast.success("Request sent to landlord successfully!");
            setFormData({ issueType: 'Plumbing', urgency: 'Low', description: '' }); 
            navigate('/'); 
            setTimeout(() => window.location.reload(), 1000); 

        } catch (error) {
            console.error(error);
            toast.error("Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <Routes>
            <Route path="/history" element={
                <div className="min-h-screen bg-[#f8f9f5] p-4 animate-fade-in text-slate-800">
                    <div className="max-w-4xl mx-auto py-8">
                        <TenantPaymentHistory onBack={() => navigate('/')} />
                    </div>
                </div>
            } />

            <Route path="*" element={
                <div className="min-h-screen bg-[#f8f9f5] relative text-slate-800 font-sans">
                    
                    {/* ELEGANT TOP NAVIGATION HEADER */}
                    <header className="bg-white border-b border-gray-200/60 sticky top-0 z-10">
                        <div className="max-w-5xl mx-auto py-4 px-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#425042] rounded-xl shadow-xs">
                                    <Home size={18} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-serif text-slate-800 leading-none mt-1">Tenant Portal</h1>
                            </div>
                            <button onClick={logout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#cc4747] transition-colors outline-none">
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    </header>
                    
                    <main className="max-w-5xl mx-auto py-10 px-6">
                        
                        {/* HOUSING PROFILE CARD */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-8">
                            <h2 className="text-base font-semibold text-slate-800 mb-6 flex items-center gap-2">
                                <User size={18} className="text-[#657655]"/> My Housing Profile
                            </h2>
                            
                            {isLoadingHousing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[1, 2, 3].map((index) => (
                                        <div key={index} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3">
                                            <div className="skeleton h-2 w-20 bg-slate-200"></div>
                                            <div className="skeleton h-5 w-3/4 bg-slate-200"></div>
                                            <div className="skeleton h-3 w-1/2 bg-slate-200 mt-1"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : housing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
                                    <div className="p-5 bg-[#f8f9f5] rounded-2xl border border-gray-200/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Managed By</span>
                                        <div className="font-medium text-slate-800 mt-1.5 text-sm">{housing.landlordName}</div>
                                        <div className="text-[11px] text-[#5c6e4e] flex items-center gap-1 mt-1 font-medium">
                                            <Mail size={12} /> {housing.landlordEmail}
                                        </div>
                                    </div>
                                    <div className="p-5 bg-[#f8f9f5] rounded-2xl border border-gray-200/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Unit</span>
                                        <div className="font-serif font-bold text-slate-800 mt-1 text-xl">Room {housing.roomNumber}</div>
                                    </div>
                                    <div className="p-5 bg-[#f8f9f5] rounded-2xl border border-gray-200/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenancy Start</span>
                                        <div className="font-medium text-slate-800 mt-1.5 flex items-center gap-1.5 text-sm">
                                            <Calendar size={14} className="text-[#657655]"/>
                                            {new Date(housing.moveInDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-amber-700 text-xs font-medium bg-amber-50 p-4 rounded-xl border border-amber-200/60">
                                    No housing details found. Please contact your property manager to link your account.
                                </div>
                            )}
                        </div>

                        {/* INTERACTIVE ACTION METRIC CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            
                            <button 
                                onClick={() => setIsChatOpen(true)}
                                className="group flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#b7c4a9] hover:shadow-md transition-all outline-none"
                            >
                                <div className="p-4 bg-[#e7efdb] rounded-full mb-4 group-hover:-translate-y-1 transition-transform border border-[#d3e0c0]">
                                    <MessageSquare size={28} className="text-[#5c6e4e]" />
                                </div>
                                <span className="text-base font-semibold text-slate-800">Message Landlord</span>
                                <span className="text-[11px] text-slate-400 font-medium mt-1">Live Chat Support</span>
                            </button>

                            <button 
                                onClick={() => navigate('/report')} 
                                className="group flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all outline-none"
                            >
                                <div className="p-4 bg-[#fef9eb] rounded-full mb-4 group-hover:-translate-y-1 transition-transform border border-[#f5ead0]">
                                    <Wrench size={28} className="text-[#b97a26]" />
                                </div>
                                <span className="text-base font-semibold text-slate-800">Report Issue</span>
                                <span className="text-[11px] text-slate-400 font-medium mt-1">Maintenance & Repairs</span>
                            </button>

                            <div className="group flex flex-col bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#425042]/30 hover:shadow-md transition-all overflow-hidden h-full">
                                <button 
                                    onClick={() => navigate('/pay')}
                                    className="flex-1 flex flex-col items-center justify-center p-6 outline-none"
                                >
                                    <div className="p-4 bg-[#425042] rounded-full mb-4 group-hover:-translate-y-1 transition-transform shadow-xs">
                                        <CreditCard size={28} className="text-white" />
                                    </div>
                                    <span className="text-base font-semibold text-slate-800">Pay Rent</span>
                                    <span className="text-[11px] text-slate-400 font-medium mt-1">Upload Digital Receipt</span>
                                </button>
                                {/* INTEGRATED HISTORY LINK */}
                                <button 
                                    onClick={() => navigate('/history')}
                                    className="w-full py-3 bg-[#f8f9f5] border-t border-gray-100 text-[10px] font-bold uppercase tracking-wider text-[#5c6e4e] hover:bg-[#e7efdb] transition-colors outline-none flex items-center justify-center gap-1"
                                >
                                    View Ledger History <ArrowRight size={12}/>
                                </button>
                            </div>
                        </div>                        

                        {/* RENDERED HISTORY LIST */}
                        <MaintenanceList /> 
                    </main>

                    {/* MODAL OVERLAYS */}
                    {activeModal === 'maintenance' && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in">
                            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                                <div className="px-8 py-5 bg-white border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-semibold text-base text-slate-800">New Maintenance Ticket</h3>
                                    <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 transition-colors outline-none">
                                        <X size={20} />
                                    </button>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-[#f8f9f5]">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Issue Category</label>
                                        <select 
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-1 focus:ring-[#425042] outline-none shadow-xs"
                                            value={formData.issueType}
                                            onChange={e => setFormData({...formData, issueType: e.target.value})}
                                        >
                                            <option value="Plumbing">Plumbing</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="Appliance">Appliance</option>
                                            <option value="Structural">Structural</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Urgency Level</label>
                                        <select 
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-1 focus:ring-[#425042] outline-none shadow-xs"
                                            value={formData.urgency}
                                            onChange={e => setFormData({...formData, urgency: e.target.value})}
                                        >
                                            <option value="Low">Low (Can wait)</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High (Needs attention)</option>
                                            <option value="Emergency">Emergency (Immediate action)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Detailed Description</label>
                                        <textarea 
                                            required
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-slate-700 text-xs font-medium focus:ring-1 focus:ring-[#425042] outline-none min-h-[100px] shadow-xs"
                                            placeholder="Describe the issue clearly for the property manager..."
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-colors disabled:opacity-50 shadow-sm outline-none"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeModal === 'payment' && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in">
                            <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-200">
                                <button 
                                    onClick={() => navigate('/')} 
                                    className="absolute -top-12 right-0 text-white hover:text-gray-200 outline-none"
                                >
                                    <X size={32} />
                                </button>

                                {housing?.landlordId ? (
                                    <TenantPaymentForm 
                                        landlordId={housing.landlordId} 
                                        onSuccess={() => navigate('/')} 
                                    />
                                ) : (
                                    <div className="bg-white p-8 rounded-[2rem] text-center border border-gray-100">
                                        <p className="text-[#cc4747] font-bold mb-2">Error: Landlord connection severed.</p>
                                        <p className="text-xs text-slate-500">Please contact support or refresh your session.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            } />
            <Route path="*" element={
            <>
                <TenantChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
                {!isChatOpen && (
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-[#425042] hover:bg-[#344034] text-white rounded-full shadow-xl flex items-center justify-center hover:-translate-y-1 transition-all z-50 outline-none border-2 border-white/20"
                    >
                        <MessageSquare size={20} />
                    </button>
                )}
            </>
        } />
        </Routes>
    );
};