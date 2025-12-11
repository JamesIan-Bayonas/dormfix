import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, User, Clock, Search } from 'lucide-react';
import { useAuth } from './UserContext';
import type { TenantRequest } from '../types/types';

interface ChecklistProps {
    onBack: () => void;
}

export const LandlordTenantChecklist: React.FC<ChecklistProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [tenants, setTenants] = useState<TenantRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        if (user?.id) {
            fetch(`http://localhost:5000/api/landlord/tenants/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    setTenants(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load tenants", err);
                    setIsLoading(false);
                });
        }
    }, [user?.id]);

    // Approve Action
    const handleApprove = async (tenantId: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/landlord/approve/${tenantId}`, {
                method: 'PATCH'
            });
            
            if (res.ok) {
                // Optimistic Update: Update UI immediately without reload
                setTenants(prev => prev.map(t => 
                    t.id === tenantId ? { ...t, is_approved: true } : t
                ));
            }
        } catch (error) {
            console.error("Error approving tenant:", error);
            alert("Failed to approve tenant. Please try again.");
        }
    };

    // Derived Lists
    const pendingTenants = tenants.filter(t => !t.is_approved);
    const activeTenants = tenants.filter(t => t.is_approved);

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={onBack} className="text-sm text-slate-500 hover:text-indigo-600 mb-4 font-medium">
                    ← Back to Dashboard
                </button>
                
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Tenant Management</h1>

                {/* SECTION 1: PENDING (The "Lobby") */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Clock className="text-amber-600" size={20} />
                            <h2 className="text-lg font-bold text-amber-900">Pending Approvals</h2>
                        </div>
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                            {pendingTenants.length} Waiting
                        </span>
                    </div>
                    
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : pendingTenants.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic">No new requests. All caught up!</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {pendingTenants.map((tenant) => (
                                <div key={tenant.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                            {tenant.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{tenant.name}</h3>
                                            <p className="text-sm text-slate-500">{tenant.email}</p>
                                            <p className="text-xs text-slate-400 mt-1">Requested: {new Date(tenant.joined_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Reject Button (Visual only for now) */}
                                        <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 text-sm font-medium transition-colors">
                                            Ignore
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(tenant.id)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            Approve Access
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SECTION 2: ACTIVE (The "List") */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <User className="text-indigo-600" size={20} />
                            Active Tenants
                        </h2>
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input type="text" placeholder="Search tenants..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Room</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {activeTenants.map((tenant) => (
                                <tr key={tenant.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {tenant.name.charAt(0)}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-slate-900">{tenant.name}</div>
                                                <div className="text-sm text-slate-500">{tenant.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {tenant.room_number || "Unassigned"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};