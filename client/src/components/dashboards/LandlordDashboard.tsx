// src/components/dashboards/LandlordDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  CreditCard, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  Home,
  BedDouble // Added icon for Rooms
} from 'lucide-react';
import { useAuth } from '../UserContext';

// Import your existing sub-components
import { LandlordMaintenanceList } from '../landlord/LandlordMaintenanceList';
import { LandlordTenantChecklist } from '../landlord/LandlordTenantChecklist';
import { LandlordRoomList } from '../landlord/LandlordRoomList';
import { LandlordPaymentHistory } from '../landlord/LandlordPaymentHistory';

type DashboardView = 'home' | 'maintenance' | 'payments' | 'tenants' | 'rooms';

export const LandlordDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Persistent View State (Keeping your original logic)
    const [currentView, setCurrentView] = useState<DashboardView>(() => {
        const savedView = localStorage.getItem('landlord_current_view');
        return (savedView as DashboardView) || 'home';
    });

    useEffect(() => {
        localStorage.setItem('landlord_current_view', currentView);
    }, [currentView]);

    if (!user) return null;

    // Helper to determine if a link is active for styling
    const getLinkClass = (view: DashboardView) => {
        const isActive = currentView === view;
        return `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
            isActive 
            ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20' 
            : 'text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white'
        }`;
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex">
            
            {/* ==================== 
                SIDEBAR (The Industrial Anchor)
                ==================== */}
            
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`
                fixed lg:static inset-y-0 left-0 z-30
                w-72 bg-emerald-950 text-white transition-transform duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Brand Header */}
                <div className="h-24 flex items-center px-8 border-b border-emerald-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                            <Home size={22} className="text-emerald-400" />
                        </div>
                        <div>
                            <span className="text-xl font-display font-bold tracking-tight block leading-none">DormFix</span>
                            <span className="text-xs text-emerald-400/80 font-medium tracking-wide">LANDLORD</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-8 space-y-2">
                    <div onClick={() => setCurrentView('home')} className={getLinkClass('home')}>
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Dashboard</span>
                    </div>
                    
                    <div onClick={() => setCurrentView('tenants')} className={getLinkClass('tenants')}>
                        <Users size={20} />
                        <span className="font-medium">Tenants</span>
                    </div>

                    <div onClick={() => setCurrentView('rooms')} className={getLinkClass('rooms')}>
                        <BedDouble size={20} />
                        <span className="font-medium">Rooms</span>
                    </div>

                    <div onClick={() => setCurrentView('maintenance')} className={getLinkClass('maintenance')}>
                        <Wrench size={20} />
                        <span className="font-medium">Maintenance</span>
                    </div>

                    <div onClick={() => setCurrentView('payments')} className={getLinkClass('payments')}>
                        <CreditCard size={20} />
                        <span className="font-medium">Payments</span>
                    </div>
                </nav>

                {/* User Info / Logout (Bottom) */}
                <div className="p-4 border-t border-emerald-900/50 m-4 bg-emerald-900/30 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-800 border border-emerald-700 flex items-center justify-center text-sm font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-emerald-400 truncate">ID: {user.dormFixId}</p>
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 text-sm font-medium rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>


            {/* ==================== 
                MAIN CONTENT (The Friendly Workspace)
                ==================== */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
                
                {/* Top Header */}
                <header className="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-gray-50 rounded-lg lg:hidden text-gray-500"
                        >
                            <Menu size={24} />
                        </button>
                        
                        {/* Context Title - Shows which page we are on */}
                        <h2 className="text-xl font-display font-bold text-gray-800 hidden sm:block capitalize">
                            {currentView === 'home' ? 'Overview' : currentView}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Bar (Visual Only) */}
                        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl w-64 border border-transparent focus-within:bg-white focus-within:border-emerald-200 focus-within:ring-2 focus-within:ring-emerald-100/50 transition-all">
                            <Search size={18} className="text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400 text-gray-700"
                            />
                        </div>
                        <button className="relative p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-500">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6 lg:p-10">
                    
                    {/* View Switcher Logic */}
                    {currentView === 'home' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Welcome Banner */}
                            <div className="mb-8">
                                <h1 className="text-3xl font-display font-bold text-gray-900">
                                    Welcome back, {user.name.split(' ')[0]}
                                </h1>
                                <p className="text-gray-500 mt-1">Here's what's happening in your dormitory today.</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard 
                                    title="Total Tenants" value="12" icon={<Users size={24} />} color="emerald" 
                                    onClick={() => setCurrentView('tenants')}
                                />
                                <StatCard 
                                    title="Room Status" value="8/10 Full" icon={<BedDouble size={24} />} color="blue" 
                                    onClick={() => setCurrentView('rooms')}
                                />
                                <StatCard 
                                    title="Pending Issues" value="3" icon={<Wrench size={24} />} color="amber" 
                                    onClick={() => setCurrentView('maintenance')}
                                    alert
                                />
                                <StatCard 
                                    title="Unverified Pays" value="2" icon={<CreditCard size={24} />} color="violet" 
                                    onClick={() => setCurrentView('payments')}
                                    alert
                                />
                            </div>

                            {/* Recent Activity / Quick Actions Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left: Quick Maintenance Preview */}
                                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-display font-bold text-lg text-gray-800">Recent Requests</h3>
                                        <button 
                                            onClick={() => setCurrentView('maintenance')}
                                            className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
                                        >
                                            View All
                                        </button>
                                    </div>
                                    {/* <LandlordMaintenanceList limit={3} />  */}
                                    {/* ^ Assuming you might add a 'limit' prop later, or it just shows all */}
                                </div>

                                {/* Right: Quick Actions */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                        <h3 className="font-display font-bold text-lg text-gray-800 mb-4">Quick Navigation</h3>
                                        <div className="space-y-3">
                                            <button 
                                                onClick={() => setCurrentView('tenants')}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left text-sm font-medium text-gray-700"
                                            >
                                                <div className="p-2 bg-white rounded-lg border border-gray-200"><Users size={16} /></div>
                                                Approve New Tenants
                                            </button>
                                            <button 
                                                onClick={() => setCurrentView('rooms')}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left text-sm font-medium text-gray-700"
                                            >
                                                <div className="p-2 bg-white rounded-lg border border-gray-200"><BedDouble size={16} /></div>
                                                Check Room Availability
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sub-Views */}
                    {currentView === 'tenants' && (
                        <div className="animate-fade-in">
                           <LandlordTenantChecklist onBack={() => setCurrentView('home')} />
                        </div>
                    )}

                    {currentView === 'rooms' && (
                        <div className="animate-fade-in">
                           <LandlordRoomList onBack={() => setCurrentView('home')} />
                        </div>
                    )}

                    {currentView === 'maintenance' && (
                        <div className="animate-fade-in">
                           <LandlordMaintenanceList />
                        </div>
                    )}

                    {currentView === 'payments' && (
                        <div className="animate-fade-in">
                           <LandlordPaymentHistory onBack={() => setCurrentView('home')} />
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

// --- Helper Component for Stat Cards ---
interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: 'emerald' | 'blue' | 'amber' | 'violet';
    onClick?: () => void;
    alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, alert }) => {
    const colorStyles = {
        emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
        amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
        violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
    };

    return (
        <button 
            onClick={onClick}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left w-full relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl transition-colors ${colorStyles[color]}`}>
                    {icon}
                </div>
                {alert && (
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </div>
            <div>
                <h4 className="text-gray-500 text-sm font-medium mb-1">{title}</h4>
                <p className="text-2xl font-display font-bold text-gray-900 group-hover:text-emerald-950 transition-colors">{value}</p>
            </div>
        </button>
    );
};