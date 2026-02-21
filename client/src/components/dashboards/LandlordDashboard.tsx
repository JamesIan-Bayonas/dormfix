// src/components/dashboards/LandlordDashboard.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Users, Wrench, CreditCard, LogOut, Bell, Search, Menu, 
  Home, BedDouble, Zap, Clock, AlertTriangle, TrendingUp, TrendingDown, DollarSign, AlertCircle, X,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../UserContext';
import { apiClient } from '../../api/client';

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

interface ActivityFeedItem {
    id: string;
    type: 'payment' | 'issue' | 'tenant';
    message: string;
    sub: string;
    time: string;
    rawTime: number;
    roomId?: string | null;
    amount?: string;
    priority?: string;
}

type DashboardView = 'home' | 'maintenance' | 'payments' | 'tenants' | 'rooms' | 'rules';

export const LandlordDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // 1. DATA FETCHING
    const { rooms } = useRooms(user?.id);
    const { requests, changeStatus: updateMaintenanceStatus } = useMaintenance(user?.id, 'landlord');
    const { payments, verifyPayment } = usePayments(user?.id);
    const [tenants, setTenants] = useState<TenantData[]>([]);

    useEffect(() => {
        if (user?.id) {
            apiClient.get<TenantData[]>(`/api/landlord/tenants/${user.id}`)
                .then(({ data }) => {
                    const formatted = data.map((t) => ({
                        id: t.id,
                        name: t.name,
                        email: t.email,
                        roomNumber: t.roomNumber,
                        isApproved: t.isApproved,
                        joinedDate: t.joinedDate ? new Date(t.joinedDate).toISOString() : new Date().toISOString()
                    }));
                    setTenants(formatted);  
                })
                .catch(err => console.error("Failed to fetch tenants:", err));
        }
    }, [user?.id]);

    // VIEW STATE
    const [currentView, setCurrentView] = useState<DashboardView>('home');
    const [searchQuery, setSearchQuery] = useState('');
    
    // DRAWER STATE (Replaces Modal State)
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    const currentMonthStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthPayments = payments.filter(p => {
            const pDate = new Date(p.datePaid);
            const isSameMonth = pDate.getMonth() === currentMonth;
            const isSameYear = pDate.getFullYear() === currentYear;
            return isSameMonth && isSameYear;
        });

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
                status: (room.currentOccupants === 0 ? 'vacant' : (roomRequests.length > 0 ? 'maintenance' : 'occupied')) as 'vacant' | 'occupied' | 'maintenance'
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
        const feed: ActivityFeedItem[] = [];
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
            
            {/* 1. SIDEBAR (Uses LayoutDashboard, Users, BedDouble, Wrench, CreditCard, LogOut) */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-emerald-950 text-white transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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

                <nav className="flex-1 px-4 py-8 space-y-2">
                    <button onClick={() => setCurrentView('home')} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentView === 'home' ? 'bg-emerald-900 text-white shadow-lg' : 'text-emerald-100/70 hover:bg-emerald-900/50'}`}>
                        <LayoutDashboard size={20} /><span className="font-medium">Dashboard</span>
                    </button>
                    <button onClick={() => setCurrentView('tenants')} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentView === 'tenants' ? 'bg-emerald-900 text-white shadow-lg' : 'text-emerald-100/70 hover:bg-emerald-900/50'}`}>
                        <Users size={20} /><span className="font-medium">Tenants</span>
                    </button>
                    <button onClick={() => setCurrentView('rooms')} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentView === 'rooms' ? 'bg-emerald-900 text-white shadow-lg' : 'text-emerald-100/70 hover:bg-emerald-900/50'}`}>
                        <BedDouble size={20} /><span className="font-medium">Rooms</span>
                    </button>
                    <button onClick={() => setCurrentView('maintenance')} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentView === 'maintenance' ? 'bg-emerald-900 text-white shadow-lg' : 'text-emerald-100/70 hover:bg-emerald-900/50'}`}>
                        <Wrench size={20} /><span className="font-medium">Maintenance</span>
                    </button>
                    <button onClick={() => setCurrentView('payments')} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentView === 'payments' ? 'bg-emerald-900 text-white shadow-lg' : 'text-emerald-100/70 hover:bg-emerald-900/50'}`}>
                        <CreditCard size={20} /><span className="font-medium">Payments</span>
                    </button>
                    <button onClick={() => setCurrentView('rules')} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentView === 'rules' ? 'bg-emerald-900 text-white shadow-lg' : 'text-emerald-100/70 hover:bg-emerald-900/50'}`}>
                        <ShieldCheck size={20} /><span className="font-medium">House Rules</span>
                    </button>
                </nav>

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
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 text-sm font-medium rounded-lg transition-colors">
                        <LogOut size={16} />Sign Out
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
                    
                    {/* 3. HOME VIEW (Uses Stats & Room Matrix) */}
                    {currentView === 'home' && (
                        <div className="space-y-8 animate-fade-in">
                            
                            {/* ALERTS (Uses AlertCircle) */}
                            {unassignedTenantsCount > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg py-2.5 px-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="text-amber-600" size={18} />
                                        <p className="text-sm text-amber-800">
                                            <span className="font-bold mr-1">Action Needed:</span> 
                                            {unassignedTenantsCount} approved tenants need room assignments.
                                        </p>
                                    </div>
                                    <button onClick={() => setCurrentView('tenants')} className="px-3 py-1.5 bg-white text-amber-700 text-xs font-bold rounded-md border border-amber-200 hover:bg-amber-50 shadow-sm transition-colors">
                                        Assign Now
                                    </button>
                                </div>
                            )}

                            {/* STATS ROW (Uses DollarSign, TrendingUp/Down) */}
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Total Tenants" value={tenants.length.toString()} icon={<Users size={24} />} color="emerald" onClick={() => setCurrentView('tenants')} />
                                <StatCard title="Total Rooms" value={rooms.length.toString()} icon={<BedDouble size={24} />} color="blue" onClick={() => setCurrentView('rooms')} />
                                <StatCard title="Active Issues" value={activeIssuesCount.toString()} icon={<Wrench size={24} />} color="amber" onClick={() => setCurrentView('maintenance')} alert={activeIssuesCount > 0} />
                                
                                <div onClick={() => setCurrentView('payments')} className="group bg-white p-6 r ounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-3 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                            <DollarSign size={24} />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${currentMonthStats.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {currentMonthStats.trend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                            {Math.abs(currentMonthStats.trend)}%
                                        </div>
                                    </div>
                                    <h4 className="text-gray-500 text-sm font-medium mb-1 font-display">Revenue (This Month)</h4>
                                    <p className="text-2xl font-display font-bold text-gray-900 mb-2">₱{currentMonthStats.verifiedRevenue.toLocaleString()}</p>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width: `${currentMonthStats.collectionRate}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* CONTROL TOWER GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Room Matrix */}
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
                                                    ${room.isCritical ? 'border-red-200 bg-red-50 animate-pulse-slow' : ''}
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

                                {/* Activity Feed (Uses Zap, Clock) */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                                        <Zap size={20} className="text-amber-500"/> Activity
                                    </h3>
                                </div>

                                {activityFeed.length > 0 ? (
                                    <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                        {activityFeed.map((activity) => (
                                            <div 
                                                key={activity.id} 
                                                onClick={() => activity.roomId && setSelectedRoomId(activity.roomId)}
                                                className={`flex gap-4 group ${activity.roomId ? 'cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors' : ''}`}
                                            >
                                                {/* ICON COLUMN */}
                                                <div className="relative flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm 
                                                        ${activity.type === 'payment' ? 'bg-violet-100 text-violet-600' : ''} 
                                                        ${activity.type === 'issue' ? 'bg-red-100 text-red-600' : ''} 
                                                        ${activity.type === 'tenant' ? 'bg-blue-100 text-blue-600' : ''}
                                                    `}>
                                                        {activity.type === 'payment' && <CreditCard size={14} />}
                                                        {activity.type === 'issue' && <Wrench size={14} />}
                                                        {activity.type === 'tenant' && <Users size={14} />}
                                                    </div>
                                                    <div className="w-0.5 h-full bg-gray-100 absolute top-8 -bottom-6 group-last:hidden"></div>
                                                </div>
                                                
                                                {/* TEXT COLUMN */}
                                                <div className="pb-2">
                                                    <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                        {activity.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock size={12} className="text-gray-400"/>
                                                        <span className="text-xs text-gray-500">{formatDate(activity.time)}</span>
                                                        
                                                        {activity.sub && (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase
                                                                ${activity.sub === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}
                                                            `}>
                                                                {activity.sub}
                                                            </span>
                                                        )}
                                                        {activity.amount && (
                                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                                {activity.amount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // EMPTY STATE
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Bell size={24} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-900 font-medium">No recent activity</p>
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. OTHER VIEWS (Now actually using the Imports!) */}
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

                    {currentView === 'rules' && (
                        <div className="animate-fade-in">
                            <LandlordRules />
                        </div>
                    )}

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

// Helper Stat Card Component
interface StatCardProps { title: string; value: string; icon: React.ReactNode; color: 'emerald' | 'blue' | 'amber' | 'violet'; onClick?: () => void; alert?: boolean; }
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, alert }) => {
    const colorStyles = { emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white", blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white", amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white", violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white" };
    return (
        <button onClick={onClick} className="h-40 group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left w-full relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl transition-colors ${colorStyles[color]}`}>{icon}</div>
                {alert && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
            </div>
            <div>
                <h4 className="text-gray-500 text-sm font-medium mb-1 font-display">{title}</h4>
                <p className="text-2xl font-display font-bold text-gray-900 group-hover:text-emerald-950 transition-colors">{value}</p>
            </div>
        </button>
    );
};
