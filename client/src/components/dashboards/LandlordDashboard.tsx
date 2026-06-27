// client/src/components/dashboards/LandlordDashboard.tsx
import { LandlordChat } from '../landlord/LandlordChat';
import { MessageSquare } from 'lucide-react'; 
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Users, Wrench, CreditCard, LogOut, Bell, Search, Menu, 
  Home, BedDouble, Clock, AlertTriangle, TrendingUp, TrendingDown, AlertCircle, X,
  ShieldCheck, Plus
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

export const LandlordDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;
    
    // DATA FETCHING
    const { rooms } = useRooms(user?.id);
    const { requests, changeStatus: updateMaintenanceStatus } = useMaintenance(user?.id, 'landlord');
    const { payments, verifyPayment } = usePayments(user?.id);
    const [tenants, setTenants] = useState<TenantData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            setIsLoadingData(true);
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
                .finally(() => setIsLoadingData(false));
        }
    }, [user?.id]);

    const currentMonthStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthPayments = payments.filter(p => {
            const pDate = new Date(p.datePaid);
            return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        });

        const verifiedRevenue = thisMonthPayments
            .filter(p => p.status.toLowerCase() === 'verified')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const pendingRevenue = thisMonthPayments
            .filter(p => p.status.toLowerCase() === 'pending')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const totalPotential = verifiedRevenue + pendingRevenue;
        const collectionRate = totalPotential > 0 ? Math.round((verifiedRevenue / totalPotential) * 100) : 0;

        const lastMonthPayments = payments.filter(p => {
            const pDate = new Date(p.datePaid);
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return pDate.getMonth() === lastMonthDate.getMonth() && pDate.getFullYear() === lastMonthDate.getFullYear();
        });
        const lastMonthRevenue = lastMonthPayments
            .filter(p => p.status.toLowerCase() === 'verified')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        let trend = 0;
        if (lastMonthRevenue > 0) {
            trend = Math.round(((verifiedRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
        } else if (verifiedRevenue > 0) {
            trend = 100;
        }

        return { verifiedRevenue, pendingRevenue, collectionRate, trend };
    }, [payments]);

    const activeIssuesCount = useMemo(() => requests.filter(r => r.status === 'Pending' || r.status === 'In Progress').length, [requests]);
    const unassignedTenantsCount = useMemo(() => tenants.filter(t => t.isApproved && (!t.roomNumber || t.roomNumber === 'Unassigned')).length, [tenants]);

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
                status: (room.currentOccupants === 0 ? 'vacant' : (roomRequests.length > 0 ? 'maintenance' : 'occupied')) as any
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

    const selectedRoomData = useMemo(() => {
        if (!selectedRoomId) return null;
        return fullRoomMatrix.find(r => r.id === selectedRoomId) || null;
    }, [selectedRoomId, fullRoomMatrix]);

    const handleVerify = useCallback(async (paymentId: string, status: 'Verified' | 'Rejected', reason?: string) => {
        await verifyPayment(paymentId, status, reason); 
    }, [verifyPayment]);

    const handleQuickResolve = useCallback(async (issueId: string) => {
        if (confirm("Mark this issue as Completed?")) await updateMaintenanceStatus(issueId, 'Completed');
    }, [updateMaintenanceStatus]);

    const activityFeed = useMemo(() => {
        const feed: any[] = [];
        const findRoomId = (num: string) => rooms.find(r => r.room_number === num)?.id;

        payments.forEach(p => {
            if (!p.datePaid) return;
            feed.push({
                id: `pay-${p.id}`,
                type: 'payment',
                message: `${p.tenantName || 'Unknown'} paid`,
                sub: p.status, 
                amount: `₱${p.amount}`,
                time: p.datePaid,
                rawTime: new Date(p.datePaid).getTime(),
                roomId: findRoomId(p.roomNumber || '')
            });
        });

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

        return feed.sort((a, b) => (b.rawTime || 0) - (a.rawTime || 0)).slice(0, 10);
    }, [payments, requests, tenants, rooms]);

    const formatDate = (d: string) => { 
        try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } 
        catch { return d; }
    };
        
    if (!user) return null;
    return (
        <div className="min-h-screen bg-[#f8f9f5] font-sans flex text-slate-800">
            
            {/* 1. SIDEBAR REDESIGN (Soft Matte Olive Setup) */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#425042] text-[#d4dbd4] transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                
                <div className="h-20 flex items-center px-6 shrink-0 pt-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-1.5 rounded-lg bg-[#b7c4a9] text-[#425042]">
                      <Home size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <span className="text-xl font-bold tracking-tight block leading-none text-white font-sans">DormFix <span className="font-normal text-[#a6b498] text-sm ml-1">2.0</span></span>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {[
                        { id: '/', icon: LayoutDashboard, label: 'Dashboard' },
                        { id: '/tenants', icon: Users, label: 'Tenants' },
                        { id: '/rooms', icon: BedDouble, label: 'Rooms' },
                        { id: '/chat', icon: MessageSquare, label: 'Messages' },
                        { id: '/maintenance', icon: Wrench, label: 'Maintenance' },
                        { id: '/payments', icon: CreditCard, label: 'Payments' },
                        { id: '/rules', icon: ShieldCheck, label: 'House Rules' }
                    ].map((item) => {
                        const targetActive = isActive(item.id);
                        return (
                            <button 
                                key={item.id}
                                onClick={() => { navigate(item.id); setIsSidebarOpen(false); }} 
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium outline-none
                                ${targetActive 
                                    ? 'bg-[#566556] text-white shadow-sm' 
                                    : 'hover:bg-[#4b5a4b] hover:text-white text-[#bac3ba]'}`}
                            >
                                <item.icon size={18} strokeWidth={targetActive ? 2.5 : 2} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 shrink-0 border-t border-[#4b5a4b]">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-[#566556] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                            {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-[#a6b498] truncate font-medium">Code: {user.dormFixId}</p>
                        </div>
                    </div>
                    <button 
                        onClick={logout} 
                        className="w-full flex items-center gap-3 px-4 py-2.5 bg-transparent hover:bg-[#4b5a4b] text-[#bac3ba] hover:text-white text-sm font-medium rounded-xl transition-all"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN PORT INTERFACE */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
                
                {/* 2. TOP GLOBAL NAVIGATION */}
                <header className="h-20 flex items-center justify-between px-6 md:px-10 shrink-0 bg-transparent">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg lg:hidden text-slate-500 bg-white border border-slate-200">
                            <Menu size={20} />
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full w-72 transition-all bg-white border border-gray-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 shadow-sm">
                            <Search size={16} className="text-gray-400" />
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
                        <button className="relative p-2.5 rounded-full transition-colors bg-white border border-gray-200 hover:bg-gray-50 shadow-sm text-gray-500">
                            <Bell size={18} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-6 md:px-10 pb-12">
                <Routes>
                    <Route path="/" element={
                        <div className="space-y-8 animate-fade-in">
                            {isLoadingData ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-40 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                                <div className="skeleton h-10 w-12 rounded-xl bg-slate-200"></div>
                                                <div>
                                                    <div className="skeleton h-8 w-24 mb-2 bg-slate-200"></div>
                                                    <div className="skeleton h-4 w-32 bg-slate-200"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 h-[500px] skeleton"></div>
                                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 h-[500px] skeleton"></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* ALERTS SYSTEM METRIC BANNER */}
                                    {unassignedTenantsCount > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl py-3 px-5 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="text-amber-600" size={18} />
                                                <p className="text-sm text-amber-800 font-medium">
                                                    <span className="font-bold mr-1">Action Required:</span> 
                                                    {unassignedTenantsCount} approved tenants need room allocations inside the directory.
                                                </p>
                                            </div>
                                            <button onClick={() => navigate('/tenants')} className="px-4 py-2 bg-white text-amber-700 text-xs font-bold rounded-full border border-amber-200 hover:bg-amber-50 shadow-sm transition-all">
                                                Assign Now
                                            </button>
                                        </div>
                                    )}

                                    {/* PAGE TITLE COMPONENT */}
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                      <div>
                                        <h1 className="text-4xl font-serif text-slate-800 mb-1">System Overview</h1>
                                        <p className="text-slate-500 text-sm">Monitor occupancy levels and maintenance alerts.</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button onClick={() => navigate('/rules')} className="px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-slate-700 text-sm font-medium flex items-center gap-2 shadow-sm transition-all">
                                           Configure Policies
                                        </button>
                                        <button onClick={() => navigate('/rooms')} className="px-5 py-2.5 rounded-full bg-[#425042] hover:bg-[#344034] text-white text-sm font-medium flex items-center gap-2 shadow-sm transition-all">
                                          <Plus size={16} /> Add Property Room
                                        </button>
                                      </div>
                                    </div>

                                    {/* REDESIGNED CONTAINER METRICS MATRIX */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Total Rooms Block */}
                                        <div onClick={() => navigate('/rooms')} className="bg-[#e7efdb] border border-[#d3e0c0] p-6 rounded-2xl flex flex-col justify-between h-40 cursor-pointer transition-all hover:shadow-sm">
                                          <div className="flex justify-between items-start">
                                            <h4 className="text-[11px] font-bold text-[#5c6e4e] uppercase tracking-wider">Total Rooms</h4>
                                            <BedDouble size={18} className="text-[#849a71]" />
                                          </div>
                                          <div>
                                            <p className="text-4xl font-serif text-[#3a4731] mb-1">{rooms.length}</p>
                                            <p className="text-xs text-[#6a7d5b] font-medium">{rooms.filter(r => r.currentOccupants === 0).length} units vacant</p>
                                          </div>
                                        </div>

                                        {/* Active Alerts Block */}
                                        <div onClick={() => navigate('/maintenance')} className="bg-[#fef9eb] border border-[#f5ead0] p-6 rounded-2xl flex flex-col justify-between h-40 cursor-pointer transition-all hover:shadow-sm">
                                          <div className="flex justify-between items-start">
                                            <h4 className="text-[11px] font-bold text-[#8b7235] uppercase tracking-wider">Active Alerts</h4>
                                            <AlertTriangle size={18} className="text-[#d4af37]" />
                                          </div>
                                          <div>
                                            <p className="text-4xl font-serif text-[#5c4b22] mb-1">{activeIssuesCount}</p>
                                            <p className="text-xs text-[#a08544] font-medium">Tickets requiring attention</p>
                                          </div>
                                        </div>

                                        {/* Total Tenants Block */}
                                        <div onClick={() => navigate('/tenants')} className="bg-[#c2ceae] border border-[#aebc98] p-6 rounded-2xl flex flex-col justify-between h-40 cursor-pointer transition-all hover:shadow-sm">
                                          <div className="flex justify-between items-start">
                                            <h4 className="text-[11px] font-bold text-[#45503a] uppercase tracking-wider">Total Tenants</h4>
                                            <Users size={18} className="text-[#657655]" />
                                          </div>
                                          <div>
                                            <div className="flex items-baseline gap-1">
                                              <p className="text-4xl font-serif text-[#2f3727] mb-1">{tenants.length}</p>
                                              <p className="text-2xl font-serif text-[#45503a] opacity-80">/ {rooms.reduce((acc, r) => acc + r.capacity, 0)}</p>
                                            </div>
                                            <p className="text-xs text-[#526045] font-medium">Active building occupancy</p>
                                          </div>
                                        </div>

                                        {/* Precise Financial Ledger Revenue Box (Corrected Audit) */}
                                        <div onClick={() => navigate('/payments')} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col justify-between h-40 cursor-pointer transition-all hover:shadow-md shadow-sm">
                                          <div className="flex justify-between items-start">
                                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collected Revenue</h4>
                                            <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${currentMonthStats.trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {currentMonthStats.trend >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                                                {Math.abs(currentMonthStats.trend)}%
                                            </div>
                                          </div>
                                          <div>
                                            <p className="text-3xl font-serif text-slate-800 mb-1">₱{currentMonthStats.verifiedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                                <span>{currentMonthStats.collectionRate}% verified rate</span>
                                                <span className="text-violet-600 font-bold">₱{currentMonthStats.pendingRevenue.toLocaleString()} pending</span>
                                            </div>
                                          </div>
                                        </div>
                                    </div>

                                    {/* CORE DATA WORKSPACES PANEL GRID */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        
                                        {/* THE GRID ROOM MATRIX CONTROL BOARD */}
                                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col h-[500px]">
                                          <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-semibold text-lg text-slate-800">Operational Room Matrix</h3>
                                            <span className="px-3 py-1 bg-[#e7efdb] text-[#5c6e4e] text-[10px] font-bold rounded-full uppercase tracking-wider">
                                              {rooms.filter(r => r.currentOccupants < r.capacity).length} Available Spaces
                                            </span>
                                          </div>
                                          
                                          {/* Balanced Layout Solution: Re-implemented clean, micro-column structure grid */}
                                          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-max">
                                              {filteredRoomMatrix.map((room) => (
                                                  <div 
                                                      key={room.id}
                                                      onClick={() => setSelectedRoomId(room.id)} 
                                                      className={`relative p-4 rounded-xl border transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-sm flex flex-col justify-between min-h-[90px]
                                                          ${room.isCritical ? 'border-red-200 bg-red-50/60' : ''}
                                                          ${room.hasIssue && !room.isCritical ? 'border-amber-200 bg-amber-50/60' : ''}
                                                          ${room.status === 'occupied' && !room.hasIssue ? 'border-emerald-100 bg-[#f4f7f4] hover:border-emerald-600' : ''}
                                                          ${room.status === 'vacant' ? 'border-gray-200 bg-white hover:border-slate-400 border-dashed' : ''}
                                                      `}
                                                  >
                                                      <div className="flex justify-between items-start">
                                                          <span className="font-bold text-slate-700 text-sm">Unit {room.room_number}</span>
                                                          {room.isCritical && <AlertTriangle size={14} className="text-[#cc4747] animate-pulse"/>}
                                                          {room.hasIssue && !room.isCritical && <Wrench size={12} className="text-amber-500"/>}
                                                      </div>
                                                      <div className="mt-4">
                                                          <p className="text-[11px] text-slate-500 font-medium truncate">
                                                              {room.status === 'vacant' ? 'Vacant' : `${room.currentOccupants}/${room.capacity} Tenants`}
                                                          </p>
                                                          <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                              <div className={`h-full rounded-full ${room.isCritical ? 'bg-red-400' : 'bg-[#657655]'}`} style={{ width: `${(room.currentOccupants/room.capacity)*100}%` }}></div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                        </div>

                                        {/* COMPREHENSIVE RECENT SYSTEMS FEED ACTIVITY LOG */}
                                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col h-[500px]">
                                          <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-semibold text-lg text-slate-800">Recent Activity Ledger</h3>
                                            <span className="px-3 py-1 bg-[#fdeeee] text-[#cc4747] text-[10px] font-bold rounded-full uppercase tracking-wider">
                                              Live Telemetry
                                            </span>
                                          </div>
                                          
                                          {activityFeed.length > 0 ? (
                                              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                                  {activityFeed.map((activity) => (
                                                      <div 
                                                          key={activity.id} 
                                                          onClick={() => activity.roomId && setSelectedRoomId(activity.roomId)} 
                                                          className={`rounded-xl p-4 border flex justify-between items-center transition-all group cursor-pointer
                                                              ${activity.type === 'payment' ? 'bg-[#f4f7f4] border-[#e8f0e8] hover:bg-[#eef2ee]' : ''}
                                                              ${activity.type === 'issue' ? 'bg-[#fff7f7] border-[#fce8e8] hover:bg-[#fff0f0]' : ''}
                                                              ${activity.type === 'tenant' ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' : ''}
                                                          `}
                                                      >
                                                          <div>
                                                              <h4 className="text-slate-800 font-medium text-xs mb-0.5">{activity.message}</h4>
                                                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                                                  <Clock size={10} />
                                                                  <span>{formatDate(activity.time)}</span>
                                                                  <span className="capitalize font-semibold">({activity.sub})</span>
                                                              </div>
                                                          </div>
                                                          <div>
                                                              {activity.amount ? (
                                                                  <span className="text-xs font-bold text-[#5c6e4e] bg-[#e7efdb] px-2 py-0.5 rounded-md">{activity.amount}</span>
                                                              ) : (
                                                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${activity.priority === 'Emergency' || activity.priority === 'High' ? 'bg-red-100 text-[#cc4747]' : 'bg-amber-100 text-amber-700'}`}>{activity.priority || 'Update'}</span>
                                                              )}
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          ) : (
                                              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                                  <Bell size={24} className="text-gray-300 mb-2" />
                                                  <p className="text-sm font-medium text-slate-400">No events logged today</p>
                                              </div>
                                          )}
                                        </div>

                                    </div>
                                </>
                            )}
                        </div>
                    } />

                    <Route path="/tenants" element={<div className="animate-fade-in"><LandlordTenantChecklist onBack={() => navigate('/')} /></div>} />
                    <Route path="/rooms" element={<div className="animate-fade-in"><LandlordRoomList onBack={() => navigate('/')} /></div>} />
                    <Route path="/maintenance" element={<div className="animate-fade-in"><LandlordMaintenanceList /></div>} />
                    <Route path="/payments" element={<div className="animate-fade-in"><LandlordPaymentHistory onBack={() => navigate('/')} /></div>} />
                    <Route path="/rules" element={<div className="animate-fade-in"><LandlordRules /></div>} />
                    <Route path="/chat" element={<div className="animate-fade-in"><LandlordChat /></div>} />
                </Routes>
            </main>
            </div>

            {/* SLIDE-OVER DRAWER MODAL CONFIG */}
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