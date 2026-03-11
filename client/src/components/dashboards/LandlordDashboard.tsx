// src/components/dashboards/LandlordDashboard.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Users, Wrench, CreditCard, LogOut, Bell, Search, Menu, 
  Home, BedDouble, Zap, Clock, AlertTriangle, TrendingUp, TrendingDown, DollarSign, AlertCircle, X,
  ShieldCheck
} from 'lucide-react';

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../UserContext';

// HOOKS
import { useRooms } from '../../hooks/useRooms';
import { useMaintenance } from '../../hooks/useMaintenance';
import { usePayments } from '../../hooks/usePayments';

// COMPONENTS
import { LandlordMaintenanceList } from '../landlord/LandlordMaintenanceList';
import { LandlordTenantChecklist } from '../landlord/LandlordTenantChecklist';
import { LandlordRoomList } from '../landlord/LandlordRoomList';
import { LandlordPaymentHistory } from '../landlord/LandlordPaymentHistory';
import { RoomDetailDrawer} from '../landlord/RoomDetailDrawer';
import { LandlordRules } from '../landlord/LandlordRules';

interface TenantData {  
    id: string;
    name: string;
    email: string;
    roomNumber?: string;
    isApproved: boolean;
    joinedDate: string;
}
type DashboardView = 'home' | 'maintenance' | 'payments' | 'tenants' | 'rooms' | 'rules';

export const LandlordDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // 🛡️ 2. Replace currentView state with Router Hooks
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;
    
    // 1. DATA FETCHING
    const { rooms } = useRooms(user?.id);
    const { requests, changeStatus: updateMaintenanceStatus } = useMaintenance(user?.id, 'landlord');
    const { payments, verifyPayment } = usePayments(user?.id);
    const [tenants, setTenants] = useState<TenantData[]>([]);

    useEffect(() => {
        if (user?.id) {
            setIsLoadingData(true); // Start loading
            fetch(`http://localhost:5000/api/landlord/tenants/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    const formatted = data.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        email: t.email,
                        roomNumber: t.roomNumber,
                        isApproved: t.isApproved,
                        joinedDate: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString()
                    }));
                    setTenants(formatted);  
                })
                .catch(err => console.error("Failed to fetch tenants:", err))
                .finally(() => setIsLoadingData(false)); // 🛡️ Stop loading regardless of success/fail
        }
    }, [user?.id]);

    // VIEW STATE
    const [currentView, setCurrentView] = useState<DashboardView>('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    // DRAWER STATE (Replaces Modal State)
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    const currentMonthStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // DEBUGGER: Check if we are receiving data
        console.log("--- DASHBOARD REVENUE CALC ---");
        console.log(`Total Raw Payments: ${payments.length}`);

        const thisMonthPayments = payments.filter(p => {
            const pDate = new Date(p.datePaid);
            const isSameMonth = pDate.getMonth() === currentMonth;
            const isSameYear = pDate.getFullYear() === currentYear;
            return isSameMonth && isSameYear;
        });

        console.log(`Payments identified for this month: ${thisMonthPayments.length}`);

        //  Verified Revenue
        const verifiedRevenue = thisMonthPayments
            .filter(p => p.status.toLowerCase() === 'verified') // Fixes 'Verified' vs 'verified'
            .reduce((sum, p) => sum + Number(p.amount), 0);

        // Pending Revenue
        const pendingRevenue = thisMonthPayments
            .filter(p => p.status.toLowerCase() === 'pending')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        // Collection Rate
        const totalPotential = verifiedRevenue + pendingRevenue;
        const collectionRate = totalPotential > 0 
            ? Math.round((verifiedRevenue / totalPotential) * 100) 
            : 0;

        // Trend (vs Last Month)
        const lastMonthPayments = payments.filter(p => {
            const pDate = new Date(p.datePaid);
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return pDate.getMonth() === lastMonthDate.getMonth() && 
                   pDate.getFullYear() === lastMonthDate.getFullYear();
        });
        const lastMonthRevenue = lastMonthPayments
            .filter(p => p.status.toLowerCase() === 'verified')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        let trend = 0;
        if (lastMonthRevenue > 0) {
            trend = Math.round(((verifiedRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
        } else if (verifiedRevenue > 0) {
            trend = 100; // 100% growth if last month was 0
        }

        return { verifiedRevenue, pendingRevenue, collectionRate, trend };
    }, [payments]);
    const activeIssuesCount = useMemo(() => requests.filter(r => r.status === 'Pending' || r.status === 'In Progress').length, [requests]);
    const unassignedTenantsCount = useMemo(() => tenants.filter(t => t.isApproved && (!t.roomNumber || t.roomNumber === 'Unassigned')).length, [tenants]);

    // 2. INTELLIGENT DATA MERGING (The heavy logic)
    // We memoize this so it only runs when data changes, not on every render
    const fullRoomMatrix = useMemo(() => {
        return rooms.map(room => {
            const occupants = tenants.filter(t => t.roomNumber === room.room_number);
            const roomRequests = requests.filter(r => r.roomNumber === room.room_number && r.status !== 'Completed' && r.status !== 'Rejected');
            const criticalIssue = roomRequests.find(i => i.urgency === 'High' || i.urgency === 'Emergency');
            
            const occupantPaymentStatus = occupants.map(occ => {
                const tenantPayments = payments.filter(p => p.tenantName === occ.name);
                const pendingPay = tenantPayments.find(p => p.status === 'Pending');
                const latestVerified = tenantPayments.find(p => p.status === 'Verified');
                return {
                    name: occ.name,
                    id: occ.id,
                    joinedDate: occ.joinedDate,
                    hasPendingPayment: !!pendingPay,
                    paymentId: pendingPay?.id,
                    paymentAmount: pendingPay?.amount,
                    paymentDate: pendingPay?.datePaid,
                    paymentProof: pendingPay?.proofImage,
                    status: pendingPay ? 'Pending' : (latestVerified ? 'Verified' : 'No Record')
                };
            });

            return {
                ...room,
                occupants,
                occupantPaymentStatus,
                activeIssues: roomRequests,
                hasIssue: roomRequests.length > 0,
                isCritical: !!criticalIssue,
                status: (room.currentOccupants === 0 ? 'vacant' : (roomRequests.length > 0 ? 'maintenance' : 'occupied')) as any // Type cast safe here
            };
        });
    }, [rooms, tenants, requests, payments]);

    const filteredRoomMatrix = useMemo(() => {
        if (!searchQuery) return fullRoomMatrix;
        const lowerQuery = searchQuery.toLowerCase();
        return fullRoomMatrix.filter(room => 
            room.room_number.toLowerCase().includes(lowerQuery) || 
            room.occupants.some(occ => occ.name.toLowerCase().includes(lowerQuery))
        );
    }, [fullRoomMatrix, searchQuery]);

    // 3. DERIVE SELECTED ROOM DATA (Fast Lookup)
    // This extracts the specific data needed for the drawer
    const selectedRoomData = useMemo(() => {
        if (!selectedRoomId) return null;
        return fullRoomMatrix.find(r => r.id === selectedRoomId) || null;
    }, [selectedRoomId, fullRoomMatrix]);

    // HANDLERS
    const handleVerify = useCallback(async (paymentId: string, status: 'Verified' | 'Rejected', reason?: string) => {
        // Note: You might need to update usePayments.ts to actually send this 'reason' to the API!
        await verifyPayment(paymentId, status, reason); 
    }, [verifyPayment]);

    const handleQuickResolve = useCallback(async (issueId: string) => {
        if (confirm("Mark this issue as Completed?")) await updateMaintenanceStatus(issueId, 'Completed');
    }, [updateMaintenanceStatus]);

    // 4. ACTIVITY FEED
    const activityFeed = useMemo(() => {
        const feed: any[] = [];
        const findRoomId = (num: string) => rooms.find(r => r.room_number === num)?.id;

        // Payments 
        payments.forEach(p => {
            if (!p.datePaid) return;
            feed.push({
                id: `pay-${p.id}`,
                type: 'payment',
                message: `${p.tenantName || 'Unknown'} paid`,
                sub: p.status, 
                amount: `₱${p.amount}`, // This text appears in the feed item
                time: p.datePaid,
                rawTime: new Date(p.datePaid).getTime(),
                roomId: findRoomId(p.roomNumber || '')
            });
        });

        // Maintenance
        requests.forEach(r => {
            if (!r.dateSubmitted) return;
            feed.push({
                id: `req-${r.id}`,
                type: 'issue',
                message: `${r.issueType} in Room ${r.roomNumber}`,
                sub: r.status,
                priority: r.urgency,
                time: r.dateSubmitted,
                rawTime: new Date(r.dateSubmitted).getTime(),
                roomId: findRoomId(r.roomNumber)
            });
        });

        // New Tenants
        tenants.forEach(t => {
            const dateStr = t.joinedDate || new Date().toISOString();
            feed.push({
                id: `new-${t.id}`,
                type: 'tenant',
                message: `${t.name} joined`,
                sub: t.isApproved ? 'Approved' : 'Pending',
                time: dateStr,
                rawTime: new Date(dateStr).getTime(),
                roomId: t.roomNumber ? findRoomId(t.roomNumber) : null
            });
        });

        // Sort by Newest
        return feed.sort((a, b) => (b.rawTime || 0) - (a.rawTime || 0)).slice(0, 10);
    }, [payments, requests, tenants, rooms]);

    const formatDate = (d: string) => { 
        try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } 
        catch { return d; }
    };
        
    if (!user) return null;
    return (
        <div className="min-h-screen bg-gray-50 font-sans flex">
            
            {/* 1. ENTERPRISE SIDEBAR (Premium Dark Theme) */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#022c22] border-r border-[#064e3b] text-emerald-50 transition-transform duration-300 ease-in-out flex flex-col shadow-xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                
                {/* Brand Header */}
                <div className="h-20 flex items-center px-8 border-b border-emerald-900/50 bg-[#022c22]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <Home size={22} className="text-[#022c22]" />
                        </div>
                        <div>
                            <span className="text-xl font-display font-bold tracking-tight block leading-none text-white">DormFix</span>
                            <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Landlord</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <button 
                        onClick={() => { navigate('/'); setIsSidebarOpen(false); }} 
                        className={`flex w-full items-center gap-3 px-4 py-3 transition-all duration-200 outline-none
                        ${isActive('/') 
                            ? 'bg-emerald-900/80 text-white font-bold border-l-4 border-emerald-400 rounded-r-xl shadow-inner' 
                            : 'text-emerald-100/60 font-medium hover:bg-emerald-900/40 hover:text-emerald-50 rounded-xl border-l-4 border-transparent'}`}
                    >
                        <LayoutDashboard size={20} className={isActive('/') ? 'text-emerald-400' : 'opacity-70'} />
                        <span>Dashboard</span>
                    </button>

                    <button 
                        onClick={() => { navigate('/tenants'); setIsSidebarOpen(false); }} 
                        className={`flex w-full items-center gap-3 px-4 py-3 transition-all duration-200 outline-none
                        ${isActive('/tenants') 
                            ? 'bg-emerald-900/80 text-white font-bold border-l-4 border-emerald-400 rounded-r-xl shadow-inner' 
                            : 'text-emerald-100/60 font-medium hover:bg-emerald-900/40 hover:text-emerald-50 rounded-xl border-l-4 border-transparent'}`}
                    >
                        <Users size={20} className={isActive('/tenants') ? 'text-emerald-400' : 'opacity-70'} />
                        <span>Tenants</span>
                    </button>

                    <button 
                        onClick={() => { navigate('/rooms'); setIsSidebarOpen(false); }} 
                        className={`flex w-full items-center gap-3 px-4 py-3 transition-all duration-200 outline-none
                        ${isActive('/rooms') 
                            ? 'bg-emerald-900/80 text-white font-bold border-l-4 border-emerald-400 rounded-r-xl shadow-inner' 
                            : 'text-emerald-100/60 font-medium hover:bg-emerald-900/40 hover:text-emerald-50 rounded-xl border-l-4 border-transparent'}`}
                    >
                        <BedDouble size={20} className={isActive('/rooms') ? 'text-emerald-400' : 'opacity-70'} />
                        <span>Rooms</span>
                    </button>

                    <button 
                        onClick={() => { navigate('/maintenance'); setIsSidebarOpen(false); }} 
                        className={`flex w-full items-center gap-3 px-4 py-3 transition-all duration-200 outline-none
                        ${isActive('/maintenance') 
                            ? 'bg-emerald-900/80 text-white font-bold border-l-4 border-emerald-400 rounded-r-xl shadow-inner' 
                            : 'text-emerald-100/60 font-medium hover:bg-emerald-900/40 hover:text-emerald-50 rounded-xl border-l-4 border-transparent'}`}
                    >
                        <Wrench size={20} className={isActive('/maintenance') ? 'text-emerald-400' : 'opacity-70'} />
                        <span>Maintenance</span>
                    </button>

                    <button 
                        onClick={() => { navigate('/payments'); setIsSidebarOpen(false); }} 
                        className={`flex w-full items-center gap-3 px-4 py-3 transition-all duration-200 outline-none
                        ${isActive('/payments') 
                            ? 'bg-emerald-900/80 text-white font-bold border-l-4 border-emerald-400 rounded-r-xl shadow-inner' 
                            : 'text-emerald-100/60 font-medium hover:bg-emerald-900/40 hover:text-emerald-50 rounded-xl border-l-4 border-transparent'}`}
                    >
                        <CreditCard size={20} className={isActive('/payments') ? 'text-emerald-400' : 'opacity-70'} />
                        <span>Payments</span>
                    </button>

                    <button 
                        onClick={() => { navigate('/rules'); setIsSidebarOpen(false); }} 
                        className={`flex w-full items-center gap-3 px-4 py-3 transition-all duration-200 outline-none
                        ${isActive('/rules') 
                            ? 'bg-emerald-900/80 text-white font-bold border-l-4 border-emerald-400 rounded-r-xl shadow-inner' 
                            : 'text-emerald-100/60 font-medium hover:bg-emerald-900/40 hover:text-emerald-50 rounded-xl border-l-4 border-transparent'}`}
                    >
                        <ShieldCheck size={20} className={isActive('/rules') ? 'text-emerald-400' : 'opacity-70'} />
                        <span>House Rules</span>
                    </button>
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-emerald-900/50 bg-[#012019]">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-800 border border-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0">
                            {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-xs text-emerald-400/80 truncate font-medium">ID: {user.dormFixId}</p>
                        </div>
                    </div>
                    {/* Fixed the Sign Out contrast issue mentioned in the other chat */}
                    <button 
                        onClick={logout} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-emerald-700 hover:bg-red-500 hover:text-white hover:border-red-500 text-emerald-200 text-sm font-bold rounded-xl transition-all shadow-sm"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
                
                {/* 2. HEADER (Uses Menu, Search, Bell, X) */}
                <header className="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-50 rounded-lg lg:hidden text-gray-500">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-display font-bold text-gray-800 hidden sm:block capitalize">
                            {currentView === 'home' ? 'Control Tower' : currentView}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl w-64 border border-transparent focus-within:bg-white focus-within:border-emerald-200 focus-within:ring-2 focus-within:ring-emerald-100/50 transition-all">
                            <Search size={18} className="text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search room or tenant..." 
                                className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400 text-gray-700"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                                    <X size={14}/>
                                </button>
                            )}
                        </div>
                        <button className="relative p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-500">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6 lg:p-10 relative">
    
                {/* 🛡️ PILLAR 4 & SUB-ROUTING INTEGRATION */}
                <Routes>
                    
                    {/* 1. THE HOME VIEW ROUTE */}
                    <Route path="/" element={
                        <div className="space-y-8 animate-fade-in">
                            {isLoadingData ? (
                                /* --- PILLAR 4: SKELETON LOADERS --- */
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-40 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                                <div className="skeleton h-12 w-12 rounded-xl bg-slate-200"></div>
                                                <div>
                                                    <div className="skeleton h-4 w-24 mb-2 bg-slate-200"></div>
                                                    <div className="skeleton h-8 w-32 bg-slate-200"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-[500px]">
                                            <div className="skeleton h-6 w-40 mb-8 bg-slate-200"></div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <div key={i} className="skeleton h-20 w-full rounded-xl bg-slate-200"></div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-[500px] flex flex-col gap-6">
                                            <div className="skeleton h-6 w-32 bg-slate-200"></div>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="flex gap-4 items-center">
                                                    <div className="skeleton h-8 w-8 rounded-full shrink-0 bg-slate-200"></div>
                                                    <div className="flex-1">
                                                        <div className="skeleton h-4 w-full mb-2 bg-slate-200"></div>
                                                        <div className="skeleton h-3 w-1/2 bg-slate-200"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* --- DATA VIEW (Your original logic + Stat Cards) --- */
                                <>
                                    {unassignedTenantsCount > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg py-2.5 px-4 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="text-amber-600" size={18} />
                                                <p className="text-sm text-amber-800">
                                                    <span className="font-bold mr-1">Action Needed:</span> 
                                                    {unassignedTenantsCount} approved tenants need room assignments.
                                                </p>
                                            </div>
                                            <button onClick={() => navigate('/tenants')} className="px-3 py-1.5 bg-white text-amber-700 text-xs font-bold rounded-md border border-amber-200 hover:bg-amber-50 shadow-sm transition-colors">
                                                Assign Now
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard 
                                            title="Total Tenants" 
                                            value={tenants.length.toString()} 
                                            icon={<Users size={20} />} 
                                            color="blue" 
                                            onClick={() => navigate('/tenants')} 
                                            subLabel={unassignedTenantsCount > 0 ? <span className="text-amber-600">{unassignedTenantsCount} unassigned</span> : <span className="text-blue-500">All assigned</span>}
                                        />
                                        <StatCard 
                                            title="Total Rooms" 
                                            value={rooms.length.toString()} 
                                            icon={<BedDouble size={20} />} 
                                            color="emerald" 
                                            onClick={() => navigate('/rooms')} 
                                            subLabel={<span className="text-emerald-600">{rooms.filter(r => r.currentOccupants === 0).length} vacant</span>}
                                        />
                                        <StatCard 
                                            title="Active Issues" 
                                            value={activeIssuesCount.toString()} 
                                            icon={<Wrench size={20} />} 
                                            color={activeIssuesCount > 0 ? "red" : "amber"} 
                                            onClick={() => navigate('/maintenance')} 
                                            alert={activeIssuesCount > 0} 
                                            subLabel={requests.some(r => (r.urgency === 'Emergency' || r.urgency === 'High') && r.status !== 'Completed') ? <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={10}/> Critical</span> : <span className="text-amber-600">All standard</span>}
                                        />
                                        <div onClick={() => navigate('/payments')} className="group bg-white p-5 rounded-2xl border border-gray-100 border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-40">
                                            <div className="flex justify-between items-start">
                                                <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                                                    <DollarSign size={20} />
                                                </div>
                                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${currentMonthStats.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {currentMonthStats.trend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                                    {Math.abs(currentMonthStats.trend)}%
                                                </div>
                                            </div>
                                            <div className="mt-auto">
                                                <p className="text-2xl font-display font-bold text-gray-900 leading-tight mb-1">₱{currentMonthStats.verifiedRevenue.toLocaleString()}</p>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Revenue</h4>
                                                    <span className="text-[10px] font-bold text-violet-600">{currentMonthStats.collectionRate}% Collected</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width: `${currentMonthStats.collectionRate}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                                                    <BedDouble size={20} className="text-emerald-600"/> Room Matrix
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {filteredRoomMatrix.map((room) => (
                                                    <div 
                                                        key={room.id}
                                                        onClick={() => setSelectedRoomId(room.id)} 
                                                        className={`relative p-4 rounded-xl border transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-md 
                                                            ${room.isCritical ? 'border-red-200 bg-red-50' : ''}
                                                            ${room.hasIssue && !room.isCritical ? 'border-amber-200 bg-amber-50' : ''}
                                                            ${room.status === 'occupied' && !room.hasIssue ? 'border-emerald-100 bg-emerald-50/30 hover:border-emerald-500' : ''}
                                                            ${room.status === 'vacant' ? 'border-gray-100 bg-gray-50 hover:border-gray-400 border-dashed' : ''}
                                                        `}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-bold text-gray-700 font-display">{room.room_number}</span>
                                                            {room.isCritical && <AlertTriangle size={16} className="text-red-500 animate-bounce"/>}
                                                            {room.hasIssue && !room.isCritical && <Wrench size={14} className="text-amber-500"/>}
                                                        </div>
                                                        <p className="text-xs text-gray-500 truncate font-medium">
                                                            {room.status === 'vacant' ? 'Available' : `${room.currentOccupants}/${room.capacity} Occ.`}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                                                    <Zap size={20} className="text-amber-500"/> Activity
                                                </h3>
                                            </div>
                                            {activityFeed.length > 0 ? (
                                                <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                                    {activityFeed.map((activity) => (
                                                        <div key={activity.id} onClick={() => activity.roomId && setSelectedRoomId(activity.roomId)} className="flex gap-4 group cursor-pointer">
                                                            <div className="relative flex flex-col items-center">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${activity.type === 'payment' ? 'bg-violet-100 text-violet-600' : ''} ${activity.type === 'issue' ? 'bg-red-100 text-red-600' : ''} ${activity.type === 'tenant' ? 'bg-blue-100 text-blue-600' : ''}`}>
                                                                    {activity.type === 'payment' && <CreditCard size={14} />}
                                                                    {activity.type === 'issue' && <Wrench size={14} />}
                                                                    {activity.type === 'tenant' && <Users size={14} />}
                                                                </div>
                                                                <div className="w-0.5 h-full bg-gray-100 absolute top-8 -bottom-6 group-last:hidden"></div>
                                                            </div>
                                                            <div className="pb-2">
                                                                <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">{activity.message}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Clock size={12} className="text-gray-400"/><span className="text-xs text-gray-500">{formatDate(activity.time)}</span>
                                                                    {activity.amount && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{activity.amount}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                                    <Bell size={24} className="text-gray-300 mb-4" />
                                                    <p className="text-gray-900 font-medium">No recent activity</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    } />

                    {/* 2. SUB-ROUTE VIEWS */}
                    <Route path="/tenants" element={<div className="animate-fade-in"><LandlordTenantChecklist onBack={() => navigate('/')} /></div>} />
                    <Route path="/rooms" element={<div className="animate-fade-in"><LandlordRoomList onBack={() => navigate('/')} /></div>} />
                    <Route path="/maintenance" element={<div className="animate-fade-in"><LandlordMaintenanceList /></div>} />
                    <Route path="/payments" element={<div className="animate-fade-in"><LandlordPaymentHistory onBack={() => navigate('/')} /></div>} />
                    <Route path="/rules" element={<div className="animate-fade-in"><LandlordRules /></div>} />

                </Routes>
            </main>
            </div>

            {/* 5. SLIDE-OVER DRAWER (The new component) */}
            <RoomDetailDrawer 
                isOpen={!!selectedRoomId}
                onClose={() => setSelectedRoomId(null)}
                roomData={selectedRoomData}
                onVerifyPayment={handleVerify}
                onResolveIssue={handleQuickResolve}
            />
        </div>
    );
};

// Helper Stat Card Component (Enterprise Redesign)
interface StatCardProps { 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    color: 'emerald' | 'blue' | 'amber' | 'violet' | 'red'; 
    onClick?: () => void; 
    alert?: boolean;
    subLabel?: string | React.ReactNode; // 🛡️ NEW: Adds context below the stat
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, alert, subLabel }) => {
    // 🛡️ NEW: Semantic mapping includes border-l-4 for enterprise visual anchoring
    const colorStyles = { 
        emerald: "bg-emerald-50 text-emerald-600 border-l-emerald-500", 
        blue: "bg-blue-50 text-blue-600 border-l-blue-500", 
        amber: "bg-amber-50 text-amber-600 border-l-amber-500", 
        violet: "bg-violet-50 text-violet-600 border-l-violet-500",
        red: "bg-red-50 text-red-600 border-l-red-500"
    };

    // Extract just the background/text classes for the icon container
    const iconColors = colorStyles[color].split(' ').slice(0, 2).join(' ');
    // Extract just the border class for the main card
    const borderClass = colorStyles[color].split(' ')[2];

    return (
        <button onClick={onClick} className={`h-40 group bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left w-full relative overflow-hidden border border-gray-100 border-l-4 ${borderClass}`}>
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2.5 rounded-xl transition-colors ${iconColors}`}>
                    {icon}
                </div>
                {alert && (
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </div>
            
            {/* 🛡️ NEW: Tightened typography and bottom-aligned content */}
            <div className="mt-auto absolute bottom-5 left-5 right-5">
                <p className="text-2xl font-display font-bold text-gray-900 leading-tight mb-1">{value}</p>
                <div className="flex justify-between items-end">
                    <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</h4>
                    {subLabel && <div className="text-xs font-medium">{subLabel}</div>}
                </div>
            </div>
        </button>
    );
};
