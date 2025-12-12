import React, { useState, useEffect } from 'react';
import { Home, LogOut, Wrench, CreditCard, Plus, X } from 'lucide-react';
import { useAuth } from '../UserContext';
import { MaintenanceList } from '../MaintenanceList'; // Reuse your existing list component

export const TenantDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        issueType: 'Plumbing',
        urgency: 'Low',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Submit Handler
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

            alert("Request sent to landlord!");
            setIsModalOpen(false);
            setFormData({ issueType: 'Plumbing', urgency: 'Low', description: '' });
            // Ideally, trigger a refresh of the list here
            window.location.reload(); 

        } catch (error) {
            console.error(error);
            alert("Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Action Card: Maintenance */}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all"
                    >
                        <div className="p-4 bg-indigo-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Wrench size={32} className="text-indigo-600" />
                        </div>
                        <span className="text-lg font-bold text-slate-800">Report Issue</span>
                        <span className="text-sm text-slate-500 mt-1">Plumbing, Electric, etc.</span>
                    </button>

                    {/* Action Card: Payment (Placeholder for now) */}
                    <button className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all">
                        <div className="p-4 bg-emerald-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <CreditCard size={32} className="text-emerald-600" />
                        </div>
                        <span className="text-lg font-bold text-slate-800">Pay Rent</span>
                        <span className="text-sm text-slate-500 mt-1">Upload Receipt</span>
                    </button>
                </div>

                {/* History List */}
                <h3 className="text-lg font-bold text-slate-900 mb-4">Your Request History</h3>
                <MaintenanceList /> 
            </main>

            {/* --- THE MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">New Maintenance Request</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Category</label>
                                <select 
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
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
        </div>
    );
};