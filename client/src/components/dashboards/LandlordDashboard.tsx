import React, { useState } from 'react';
import { LogOut, Wrench, CreditCard, LayoutDashboard, Users } from 'lucide-react';
import { useAuth } from '../UserContext';
import { LandlordMaintenanceList } from '../LandlordMaintenanceList';
import { LandlordTenantChecklist } from '../LandlordTenantChecklist';

type DashboardView = 'home' | 'maintenance' | 'payments' | 'tenants';

export const LandlordDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [currentView, setCurrentView] = useState<DashboardView>('home');

    if (!user) return <div />; 

    // Render Sub-Components based on state
    if (currentView === 'tenants') {
        return <LandlordTenantChecklist onBack={() => setCurrentView('home')} />;
    }
    // (Note: You can wrap MaintenanceList similarly later if you want full navigation)

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <LayoutDashboard size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">DormFix Admin</h1>
                            <p className="text-xs text-slate-500">Code: <span className="font-mono font-bold bg-slate-100 px-1 rounded">{user.dormFixId}</span></p>
                        </div>
                    </div>
                    <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0">
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-900">Welcome, {user.name}</h2>
                        <p className="text-slate-600 mt-1">Select a module to manage your dormitory.</p>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* 1. Maintenance Module */}
                        <button className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all">
                            <div className="p-4 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors mb-4">
                                <Wrench size={32} className="text-indigo-600" />
                            </div>
                            <span className="text-lg font-bold text-slate-800">Maintenance</span>
                            <span className="text-sm text-slate-500 mt-1">3 Requests Pending</span>
                        </button>

                        {/* 2. Payments Module */}
                        <button className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-200 transition-all">
                            <div className="p-4 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors mb-4">
                                <CreditCard size={32} className="text-emerald-600" />
                            </div>
                            <span className="text-lg font-bold text-slate-800">Payments</span>
                            <span className="text-sm text-slate-500 mt-1">Verify Receipts</span>
                        </button>

                        {/* 3. Tenant Management Module (NEW) */}
                        <button 
                            onClick={() => setCurrentView('tenants')}
                            className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-200 transition-all"
                        >
                            <div className="p-4 bg-amber-50 rounded-full group-hover:bg-amber-100 transition-colors mb-4">
                                <Users size={32} className="text-amber-600" />
                            </div>
                            <span className="text-lg font-bold text-slate-800">Tenants</span>
                            <span className="text-sm text-slate-500 mt-1">Approve & Manage</span>
                        </button>

                    </div>

                    {/* Quick View Section (Existing List) */}
                    <div className="mt-8">
                        <LandlordMaintenanceList /> 
                    </div>
                </div>
            </main>
        </div>
    );
};