import { MessageSquare } from 'lucide-react'; // Ensure this is imported
import { TenantChat } from '../tenant/TenantChat';
import React, { useState, useEffect } from 'react';
import { Home, LogOut, Wrench, CreditCard, X, User, Calendar, Mail } from 'lucide-react';
import { useAuth } from '../UserContext';
import { MaintenanceList } from '../MaintenanceList';
import { TenantPaymentForm } from '../tenant/TenantPaymentForm'; 
import { TenantPaymentHistory } from '../tenant/TenantPaymentHistory';

// IMPORTS: Router and Toasts
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
    
    // ROUTER HOOKS (Replaces activeModal and showHistory states)
    const navigate = useNavigate();
    const location = useLocation();

    // Derive modal state directly from the URL!
    const activeModal = location.pathname.includes('/pay') ? 'payment' : location.pathname.includes('/report') ? 'maintenance' : null;

    const [housing, setHousing] = useState<HousingDetails | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // 3. SKELETON STATE: Track when housing data is loading
    const [isLoadingHousing, setIsLoadingHousing] = useState(true);
    
    // Form State for Maintenance
    const [formData, setFormData] = useState({
        issueType: 'Plumbing',
        urgency: 'Low',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // FETCH HOUSING DETAILS ON LOAD
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
                .finally(() => setIsLoadingHousing(false)); // 🛡️ Stop loading indicator
        }
    }, [user?.id]);

    // Submit Handler (Maintenance)
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

            // 🛡️ NEW: Replaced alert() with Toast and Navigate
            toast.success("Request sent to landlord successfully!");
            setFormData({ issueType: 'Plumbing', urgency: 'Low', description: '' }); 
            
            navigate('/'); // Closes the modal by reverting the URL
            
            // Optional: Reload to fetch new data, though ideally you'd refetch via a hook
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
            {/* ROUTE 1: THE HISTORY FULL-PAGE VIEW */}
            <Route path="/history" element={
                <div className="min-h-screen bg-slate-100 p-4 animate-fade-in">
                    <div className="max-w-4xl mx-auto py-8">
                        <TenantPaymentHistory onBack={() => navigate('/')} />
                    </div>
                </div>
            } />

            {/* ROUTE 2: THE MAIN DASHBOARD (Matches /, /pay, and /report) */}
            <Route path="*" element={
                <div className="min-h-screen bg-slate-100 relative">
                    {/* Header */}
                    <header className="bg-white shadow-sm sticky top-0 z-10">
                        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Home size={20} className="text-indigo-700" />
                                </div>
                                <h1 className="text-xl font-semibold text-slate-900">Tenant Portal</h1>
                            </div>
                            <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600">
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </header>
                    
                    {/* Main Content */}
                    <main className="max-w-7xl mx-auto py-8 px-4">
                        
                        {/* Housing Profile Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <User size={20} className="text-indigo-600"/> My Housing Profile
                            </h2>
                            
                            {/* PILLAR 4: SKELETON LOADER INTEGRATION */}
                            {isLoadingHousing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[1, 2, 3].map((index) => (
                                        <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-3">
                                            <div className="skeleton h-3 w-24 bg-slate-200"></div>
                                            <div className="skeleton h-6 w-3/4 bg-slate-200"></div>
                                            <div className="skeleton h-4 w-1/2 bg-slate-200 mt-1"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : housing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Managed By</span>
                                        <div className="font-medium text-slate-900 mt-1">{housing.landlordName}</div>
                                        <div className="text-sm text-indigo-600 flex items-center gap-1 mt-1">
                                            <Mail size={12} /> {housing.landlordEmail}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Unit</span>
                                        <div className="font-medium text-slate-900 mt-1 text-lg">Room {housing.roomNumber}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenancy Start</span>
                                        <div className="font-medium text-slate-900 mt-1 flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-400"/>
                                            {new Date(housing.moveInDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-amber-600 text-sm bg-amber-50 p-4 rounded-lg border border-amber-200">
                                    No housing details found. Please contact your landlord.
                                </div>
                            )}
                        </div>

                        {/* Action Cards */}
                        {/* 🛡️ 1. CHANGED: md:grid-cols-2 is now md:grid-cols-3 to fit 3 cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            
                            {/* 🛡️ 2. NEW: Message Landlord Card (Placed First) */}
                            <button 
                                onClick={() => setIsChatOpen(true)}
                                className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all"
                            >
                                <div className="p-4 bg-indigo-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                    <MessageSquare size={32} className="text-indigo-600" />
                                </div>
                                <span className="text-lg font-bold text-slate-800">Message Landlord</span>
                                <span className="text-sm text-slate-500 mt-1">Live Chat Support</span>
                            </button>

                            {/* 3. Your Existing Report Issue Button */}
                            <button 
                                onClick={() => navigate('/report')} 
                                className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all"
                            >
                                <div className="p-4 bg-indigo-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                    <Wrench size={32} className="text-indigo-600" />
                                </div>
                                <span className="text-lg font-bold text-slate-800">Report Issue</span>
                                <span className="text-sm text-slate-500 mt-1">Plumbing, Electric, etc.</span>
                            </button>

                            {/* 4. Your Existing Pay Rent Container */}
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => navigate('/pay')}
                                    className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all h-full"
                                >
                                    <div className="p-4 bg-emerald-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <CreditCard size={32} className="text-emerald-600" />
                                    </div>
                                    <span className="text-lg font-bold text-slate-800">Pay Rent</span>
                                    <span className="text-sm text-slate-500 mt-1">Upload Receipt</span>
                                </button>
                                
                                <button 
                                    onClick={() => navigate('/history')}
                                    className="text-xs text-center text-emerald-600 font-medium hover:underline py-2"
                                >
                                    View Payment History
                                </button>
                            </div>
                        </div>                        

                        {/* History List */}
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Your Request History</h3>
                        <MaintenanceList /> 
                    </main>

                    {/* CONTEXTUAL MODALS: They render OVER the dashboard if the URL matches */}
                    
                    {/* MAINTENANCE MODAL */}
                    {activeModal === 'maintenance' && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-slate-800">New Maintenance Request</h3>
                                    {/* Closes modal by returning to root URL */}
                                    <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Issue Category</label>
                                        <select 
                                            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Urgency Level</label>
                                        <select 
                                            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea 
                                            required
                                            className="w-full p-3 bg-white border border-slate-300 rounded-lg text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                                            placeholder="Describe the issue clearly..."
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* PAYMENT MODAL */}
                    {activeModal === 'payment' && (
                        <div className="fixed inset-0 bg-black/50 flex text-gray-800 items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                            <div className="relative w-full max-w-lg animate-in zoom-in duration-200">
                                {/* Closes modal by returning to root URL */}
                                <button 
                                    onClick={() => navigate('/')} 
                                    className="absolute -top-12 right-0 text-white hover:text-gray-200"
                                >
                                    <X size={32} />
                                </button>

                                {housing?.landlordId ? (
                                    <TenantPaymentForm 
                                        landlordId={housing.landlordId} 
                                        onSuccess={() => navigate('/')} // Closes modal upon success
                                    />
                                ) : (
                                    <div className="bg-white p-6 rounded-xl text-center">
                                        <p className="text-red-500 font-bold">Error: Landlord details not found.</p>
                                        <p className="text-sm text-slate-500">Please contact support or try logging in again.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            } />
            <Route path="*" element={
            <>
                {/* The Floating Chat Window */}
                <TenantChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

                {/* The Floating Action Button (FAB) - Only shows when chat is CLOSED */}
                {!isChatOpen && (
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all z-50 animate-bounce-short"
                    >
                        <MessageSquare size={24} />
                    </button>
                )}
            </>
        } />
        </Routes>
    );
};