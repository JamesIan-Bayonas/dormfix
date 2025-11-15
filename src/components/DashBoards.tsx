// src/components/Dashboards.tsx
import React from 'react';
import { Home, LogOut, Wrench, CreditCard, LayoutDashboard, User as UserIcon } from 'lucide-react';
import type { User } from '../types/types';
import { useAuth } from './UserContext';

// Tenant Dashboard
export const TenantDashboard: React.FC = () => {
    const { user, logout } = useAuth(); // Accessing context via hook
    if (!user) return <div />; // Should not happen if rendering is correct

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Home size={20} className="text-indigo-700" />
                        </div>
                        <h1 className="text-xl font-semibold text-slate-900">DormFix Tenant Portal</h1>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Welcome, {user.name}!</h2>
                        <p className="text-slate-600 mt-1">Here you can manage your maintenance requests and view payment history.</p>
                    </div>
                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-indigo-600 hover:bg-indigo-50">
                            <Wrench size={32} className="mb-3" />
                            <span className="text-lg font-semibold text-slate-800">New Maintenance Request</span>
                            <span className="text-sm text-slate-500 mt-1">Report a new issue</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-green-600 hover:bg-green-50">
                            <CreditCard size={32} className="mb-3" />
                            <span className="text-lg font-semibold text-slate-800">Upload Payment</span>
                            <span className="text-sm text-slate-500 mt-1">Submit your rent receipt</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Landlord Dashboard
export const LandlordDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    if (!user) return <div />; 

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <LayoutDashboard size={20} className="text-white" />
                        </div>
                        <h1 className="text-xl font-semibold text-slate-900">DormFix Admin Panel</h1>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Welcome, {user.name} (Landlord)!</h2>
                        <p className="text-slate-600 mt-1">You can now manage pending requests and verify payments.</p>
                    </div>
                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-indigo-600 hover:bg-indigo-50">
                            <Wrench size={32} className="mb-3" />
                            <span className="text-lg font-semibold text-slate-800">View Maintenance Requests</span>
                            <span className="text-sm text-slate-500 mt-1">3 Pending</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-green-600 hover:bg-green-50">
                            <CreditCard size={32} className="mb-3" />
                            <span className="text-lg font-semibold text-slate-800">Verify Payments</span>
                            <span className="text-sm text-slate-500 mt-1">1 New Submission</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};