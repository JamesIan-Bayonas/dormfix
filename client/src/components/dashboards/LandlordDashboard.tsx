import React, { useState, useEffect } from 'react';
import { LogOut, Wrench, CreditCard, LayoutDashboard, Users } from 'lucide-react';
import { useAuth } from '../UserContext';
import { LandlordMaintenanceList } from '../landlord/LandlordMaintenanceList';
import { LandlordTenantChecklist } from '../landlord/LandlordTenantChecklist';

type DashboardView = 'home' | 'maintenance' | 'payments' | 'tenants';

export const LandlordDashboard: React.FC = () => {
    const { user, logout } = useAuth();

    // 1. UPDATED STATE: Lazy Initialization
    // Instead of just 'home', we check if there is a saved view in LocalStorage first.
    const [currentView, setCurrentView] = useState<DashboardView>(() => {
        const savedView = localStorage.getItem('landlord_current_view');
        // We cast it to DashboardView if it exists, otherwise default to 'home'
        return (savedView as DashboardView) || 'home';
    });

    // 2. NEW EFFECT: Persist State
    // Whenever currentView changes (user clicks a button), we save it to storage.
    useEffect(() => {
        localStorage.setItem('landlord_current_view', currentView);
    }, [currentView]);

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
                    
                    {/* Only show the Welcome Banner on the Home view */}
                    {currentView === 'home' && (
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-900">Welcome, {user.name}</h2>
                            <p className="text-slate-600 mt-1">Select a module to manage your dormitory.</p>
                        </div>
                    )}

                    {/* Dashboard Grid - Only show on Home view */}
                    {currentView === 'home' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* 1. Maintenance Module */}
                            <button 
                                onClick={() => setCurrentView('maintenance')} // Just sets state, doesn't navigate yet
                                className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all"
                            >
                                <div className="p-4 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors mb-4">
                                    <Wrench size={32} className="text-indigo-600" />
                                </div>
                                <span className="text-lg font-bold text-slate-800">Maintenance</span>
                                <span className="text-sm text-slate-500 mt-1">Manage Requests</span>
                            </button>

                            {/* 2. Payments Module */}
                            <button className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-200 transition-all">
                                <div className="p-4 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors mb-4">
                                    <CreditCard size={32} className="text-emerald-600" />
                                </div>
                                <span className="text-lg font-bold text-slate-800">Payments</span>
                                <span className="text-sm text-slate-500 mt-1">Verify Receipts</span>
                            </button>

                            {/* 3. Tenant Management Module */}
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
                    ) : null}

                    {/* Quick View Section (Show Maintenance List if view is 'home' or 'maintenance') */}
                    {(currentView === 'home' || currentView === 'maintenance') && (
                        <div className="mt-8">
                            {/* Add a "Back" button if we are specifically in 'maintenance' view */}
                            {currentView === 'maintenance' && (
                                <button onClick={() => setCurrentView('home')} className="mb-4 text-sm text-slate-500 hover:text-indigo-600 font-medium">
                                    ← Back to Dashboard
                                </button>
                            )}
                            <LandlordMaintenanceList /> 
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};