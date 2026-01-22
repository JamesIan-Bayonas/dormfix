// src/components/dashboards/LandlordDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Wrench, CreditCard, LogOut, Bell, Search, Menu, 
  Home, BedDouble, Zap, Clock, AlertTriangle, CheckCircle2, AlertCircle, 
  X, ArrowRight, DollarSign, TrendingUp, TrendingDown, Eye, FileX, Check 
} from 'lucide-react';
import { useAuth } from '../UserContext';

// HOOKS
import { useRooms } from '../../hooks/useRooms';
import { useMaintenance } from '../../hooks/useMaintenance';
import { usePayments } from '../../hooks/usePayments';

// SUB-COMPONENTS
import { LandlordMaintenanceList } from '../landlord/LandlordMaintenanceList';
import { LandlordTenantChecklist } from '../landlord/LandlordTenantChecklist';
import { LandlordRoomList } from '../landlord/LandlordRoomList';
import { LandlordPaymentHistory } from '../landlord/LandlordPaymentHistory';
import type { UrgencyLevel } from '../../types/types';

interface TenantData {
    id: string;
    name: string;
    email: string;
    roomNumber?: string;
    isApproved: boolean;
    joinedDate: string;
}

type DashboardView = 'home' | 'maintenance' | 'payments' | 'tenants' | 'rooms';

export const LandlordDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // 1. DATA FETCHING
    const { rooms, isLoading: roomsLoading } = useRooms(user?.id);
    const { requests, changeStatus: updateMaintenanceStatus } = useMaintenance(user?.id, 'landlord');
    const { payments, verifyPayment } = usePayments(user?.id);
    
    const [tenants, setTenants] = useState<TenantData[]>([]);

    useEffect(() => {
        if (user?.id) {
            fetch(`http://localhost:5000/api/landlord/tenants/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    const formatted = data.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        email: t.email,
                        roomNumber: t.roomNumber,
                        isApproved: t.isApproved,
                        joinedDate: t.createdAt || new Date().toISOString()
                    }));
                    setTenants(formatted);
                })
                .catch(err => console.error("Failed to fetch tenants:", err));
        }
    }, [user?.id]);

    // 2. VIEW & SEARCH STATE
    const [currentView, setCurrentView] = useState<DashboardView>(() => {
        return (localStorage.getItem('landlord_current_view') as DashboardView) || 'home';
    });
    
    // Search Query State
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal States
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [reviewPaymentId, setReviewPaymentId] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('landlord_current_view', currentView);
    }, [currentView]);

    // 3. INTELLIGENT DATA MERGING
    
    // Helper: Urgency Colors
    const getUrgencyStyles = (urgency: string) => {
        switch(urgency) {
            case 'Emergency':
            case 'High': return "bg-red-50 border-red-200 text-red-700";
            case 'Medium': return "bg-orange-50 border-orange-200 text-orange-700";
            case 'Low': return "bg-slate-50 border-slate-200 text-slate-700";
            default: return "bg-gray-50 border-gray-200 text-gray-700";
        }
    };

    // Helper: Current Month Stats
    const currentMonthStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const thisMonthPayments = payments.filter(p => {
            const pDate = new Date(p.datePaid);
            return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        });

        const lastMonthPayments = payments.filter(p => {
            const pDate = new Date(p.datePaid);
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return pDate.getMonth() === lastMonthDate.getMonth() && pDate.getFullYear() === lastMonthDate.getFullYear();
        });

        const verifiedRevenue = thisMonthPayments.filter(p => p.status === 'Verified').reduce((sum, p) => sum + Number(p.amount), 0);
        const lastMonthRevenue = lastMonthPayments.filter(p => p.status === 'Verified').reduce((sum, p) => sum + Number(p.amount), 0);
        const pendingRevenue = thisMonthPayments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + Number(p.amount), 0);

        let trend = 0;
        if (lastMonthRevenue > 0) {
            trend = Math.round(((verifiedRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
        } else if (verifiedRevenue > 0) {
            trend = 100;
        }

        const collectionRate = (verifiedRevenue + pendingRevenue) > 0 
            ? Math.round((verifiedRevenue / (verifiedRevenue + pendingRevenue)) * 100) 
            : 0;

        return { verifiedRevenue, pendingRevenue, collectionRate, trend };
    }, [payments]);

    const activeIssuesCount = useMemo(() => requests.filter(r => r.status === 'Pending' || r.status === 'In Progress').length, [requests]);
    const unassignedTenantsCount = useMemo(() => tenants.filter(t => t.isApproved && (!t.roomNumber || t.roomNumber === 'Unassigned')).length, [tenants]);

    // MATRIX: Filtered by Search
    const filteredRoomMatrix = useMemo(() => {
        const fullMatrix = rooms.map(room => {
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
                status: room.currentOccupants === 0 ? 'vacant' : (roomRequests.length > 0 ? 'maintenance' : 'occupied')
            };
        });

        if (!searchQuery) return fullMatrix;
        const lowerQuery = searchQuery.toLowerCase();
        return fullMatrix.filter(room => 
            room.room_number.toLowerCase().includes(lowerQuery) || 
            room.occupants.some(occ => occ.name.toLowerCase().includes(lowerQuery))
        );
    }, [rooms, tenants, requests, payments, searchQuery]);

    // Activity Feed
    const activityFeed = useMemo(() => {
        const feed: { id: string; type: string; message: string; sub: string; amount?: string; time: string; rawTime: number; roomId: string | null | undefined; priority?: UrgencyLevel; }[] = [];
        const findRoomId = (num: string) => rooms.find(r => r.room_number === num)?.id;

        payments.forEach(p => feed.push({ 
            id: `pay-${p.id}`, 
            type: 'payment', 
            message: `${p.tenantName} paid`, 
            sub: p.status, 
            amount: `₱${p.amount}`, 
            time: p.datePaid, 
            rawTime: new Date(p.datePaid).getTime(),
            roomId: findRoomId(p.roomNumber) 
        }));
        
        requests.forEach(r => feed.push({ 
            id: `req-${r.id}`, 
            type: 'issue', 
            message: `${r.issueType} in Room ${r.roomNumber}`, 
            sub: r.status, 
            priority: r.urgency, 
            time: r.dateSubmitted, 
            rawTime: new Date(r.dateSubmitted).getTime(),
            roomId: findRoomId(r.roomNumber) 
        }));
        
        tenants.forEach(t => feed.push({ 
            id: `new-${t.id}`, 
            type: 'tenant', 
            message: `${t.name} joined`, 
            sub: t.isApproved ? 'Approved' : 'Pending', 
            time: t.joinedDate, 
            rawTime: new Date(t.joinedDate).getTime(),
            roomId: t.roomNumber ? findRoomId(t.roomNumber) : null
        }));

        return feed.sort((a, b) => b.rawTime - a.rawTime).slice(0, 10);
    }, [payments, requests, tenants, rooms]);

    // ACTIONS
    const handleNavigationToRoom = (roomNumber: string) => {
        setSearchQuery(roomNumber); 
        setSelectedRoomId(null);    
        setCurrentView('rooms');    
    };

    const handleVerify = async (paymentId: string, status: 'Verified' | 'Rejected') => {
        await verifyPayment(paymentId, status);
        setReviewPaymentId(null); 
    };

    const handleQuickResolve = async (issueId: string) => {
        if (confirm("Mark this issue as Completed?")) await updateMaintenanceStatus(issueId, 'Completed');
    };

    const getLinkClass = (view: DashboardView) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer group ${currentView === view ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20' : 'text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white'}`;
    const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return d; }};

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex">
            
            {/* SIDEBAR */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
            <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-emerald-950 text-white transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-24 flex items-center px-8 border-b border-emerald-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10"><Home size={22} className="text-emerald-400" /></div>
                        <div><span className="text-xl font-display font-bold tracking-tight block leading-none">DormFix</span><span className="text-xs text-emerald-400/80 font-medium tracking-wide">LANDLORD</span></div>
                    </div>
                </div>
                <nav className="flex-1 px-4 py-8 space-y-2">
                    <div onClick={() => setCurrentView('home')} className={getLinkClass('home')}><LayoutDashboard size={20} /><span className="font-medium">Dashboard</span></div>
                    <div onClick={() => setCurrentView('tenants')} className={getLinkClass('tenants')}><Users size={20} /><span className="font-medium">Tenants</span></div>
                    <div onClick={() => setCurrentView('rooms')} className={getLinkClass('rooms')}><BedDouble size={20} /><span className="font-medium">Rooms</span></div>
                    <div onClick={() => setCurrentView('maintenance')} className={getLinkClass('maintenance')}><Wrench size={20} /><span className="font-medium">Maintenance</span></div>
                    <div onClick={() => setCurrentView('payments')} className={getLinkClass('payments')}><CreditCard size={20} /><span className="font-medium">Payments</span></div>
                </nav>
                <div className="p-4 border-t border-emerald-900/50 m-4 bg-emerald-900/30 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-full bg-emerald-800 border border-emerald-700 flex items-center justify-center text-sm font-bold">{user.name.charAt(0)}</div><div className="overflow-hidden"><p className="text-sm font-medium text-white truncate">{user.name}</p><p className="text-xs text-emerald-400 truncate">ID: {user.dormFixId}</p></div></div>
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 text-sm font-medium rounded-lg transition-colors"><LogOut size={16} />Sign Out</button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
                <header className="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-4"><button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-50 rounded-lg lg:hidden text-gray-500"><Menu size={24} /></button><h2 className="text-xl font-display font-bold text-gray-800 hidden sm:block capitalize">{currentView === 'home' ? 'Control Tower' : currentView}</h2></div>
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
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>}
                        </div>
                        <button className="relative p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-500"><Bell size={20} /><span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span></button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-gray-50/50 -mt-3 lg:p-10 relative">
                    {currentView === 'home' && (
                        <div className="space-y-8 animate-fade-in">
                            
                            {/* ALERTS: UNASSIGNED TENANTS */}
                            {unassignedTenantsCount > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg py-3 px-4 flex items-center justify-between shadow-sm animate-bounce-in mb-4">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="text-amber-600" size={18} />
                                        <p className="text-sm text-amber-800">
                                            <span className="font-bold mr-1">Action Needed:</span> 
                                            {unassignedTenantsCount} approved tenants need room assignments.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setCurrentView('tenants')} 
                                        className="px-3 py-1.5 bg-white text-amber-700 text-xs font-bold rounded-md border border-amber-200 hover:bg-amber-50 shadow-sm transition-colors"
                                    >
                                        Assign Now
                                    </button>
                                </div>
                            )}

                            {/* STATS ROW */}
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Total Tenants" value={tenants.length.toString()} icon={<Users size={24} />} color="emerald" onClick={() => setCurrentView('tenants')} />
                                <StatCard title="Total Rooms" value={rooms.length.toString()} icon={<BedDouble size={24} />} color="blue" onClick={() => setCurrentView('rooms')} />
                                <StatCard title="Active Issues" value={activeIssuesCount.toString()} icon={<Wrench size={24} />} color="amber" onClick={() => setCurrentView('maintenance')} alert={activeIssuesCount > 0} />
                                
                                <div onClick={() => setCurrentView('payments')} className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-3 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors"><DollarSign size={24} /></div>
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
                                    <p className="text-xs text-gray-400 mt-2 flex justify-between">
                                        <span>{currentMonthStats.collectionRate}% Collected</span>
                                        {currentMonthStats.pendingRevenue > 0 && <span className="text-amber-600">₱{currentMonthStats.pendingRevenue.toLocaleString()} Pending</span>}
                                    </p>
                                </div>
                            </div>

                            {/* CONTROL TOWER */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
                                
                                {/* ROOM MATRIX */}
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2"><BedDouble size={20} className="text-emerald-600"/> Room Matrix</h3>
                                        <div className="flex gap-4 text-xs font-medium text-gray-500">
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>OK</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Issue</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-300"></div>Empty</span>
                                        </div>
                                    </div>
                                    
                                    {filteredRoomMatrix.length > 0 ? (
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
                                                    <p className="text-xs text-gray-500 truncate font-medium">{room.status === 'vacant' ? 'Available' : `${room.currentOccupants}/${room.capacity} Occ.`}</p>

                                                    {/* TRANSPARENCY TOOLTIP */}
                                                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                                        {room.status === 'vacant' ? (
                                                            <p className="text-center font-semibold">Vacant Unit</p>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <p className="text-gray-400 uppercase text-[10px] tracking-wider font-bold">Occupants:</p>
                                                                {room.occupants.map(o => <div key={o.id} className="font-medium">{o.name}</div>)}
                                                                {room.hasIssue && <p className="text-red-300 pt-1 mt-1 border-t border-gray-700">⚠ {room.activeIssues.length} Issue(s)</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-400 italic">No rooms found matching "{searchQuery}"</div>
                                    )}
                                </div>

                                {/* ACTIVITY FEED */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-6"><h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2"><Zap size={20} className="text-amber-500"/> Activity</h3></div>
                                    {activityFeed.length > 0 ? (
                                        <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                            {activityFeed.map((activity) => (
                                                <div 
                                                    key={activity.id} 
                                                    onClick={() => activity.roomId && setSelectedRoomId(activity.roomId)}
                                                    className={`flex gap-4 group ${activity.roomId ? 'cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors' : ''}`}
                                                >
                                                    <div className="relative flex flex-col items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${activity.type === 'payment' ? 'bg-violet-100 text-violet-600' : ''} ${activity.type === 'issue' ? 'bg-red-100 text-red-600' : ''} ${activity.type === 'tenant' ? 'bg-blue-100 text-blue-600' : ''}`}>{activity.type === 'payment' && <CreditCard size={14} />}{activity.type === 'issue' && <Wrench size={14} />}{activity.type === 'tenant' && <Users size={14} />}</div><div className="w-0.5 h-full bg-gray-100 absolute top-8 -bottom-6 group-last:hidden"></div></div>
                                                    <div className="pb-2">
                                                        <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">{activity.message}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Clock size={12} className="text-gray-400"/><span className="text-xs text-gray-500">{formatDate(activity.time)}</span>
                                                            {activity.sub && <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-2">{activity.sub}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-4"><div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Bell size={24} className="text-gray-300" /></div><p className="text-gray-900 font-medium">No recent activity.</p></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'tenants' && <div className="animate-fade-in"><LandlordTenantChecklist onBack={() => setCurrentView('home')} /></div>}
                    {currentView === 'rooms' && <div className="animate-fade-in"><LandlordRoomList onBack={() => setCurrentView('home')} /></div>}
                    {currentView === 'maintenance' && <div className="animate-fade-in"><LandlordMaintenanceList /></div>}
                    {currentView === 'payments' && <div className="animate-fade-in"><LandlordPaymentHistory onBack={() => setCurrentView('home')} /></div>}
                </main>
            </div>

            {/* ACTION MODAL */}
            {selectedRoomId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
                        {(() => {
                            const room = rooms.find(r => r.id === selectedRoomId);
                            if (!room) return null;
                            const roomData = filteredRoomMatrix.find(r => r.id === room.id); 

                            // PAYMENT REVIEW SUB-MODAL 
                            if (reviewPaymentId && roomData) {
                                const occWithPay = roomData.occupantPaymentStatus.find(o => o.paymentId === reviewPaymentId);
                                return (
                                    <div className="p-6 bg-white">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={20}/> Review Payment</h3>
                                        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                <div><p className="text-gray-500">Tenant</p><p className="font-bold">{occWithPay?.name}</p></div>
                                                <div><p className="text-gray-500">Amount</p><p className="font-bold text-emerald-600">₱{occWithPay?.paymentAmount}</p></div>
                                                <div><p className="text-gray-500">Date</p><p className="font-bold">{formatDate(occWithPay?.paymentDate || '')}</p></div>
                                            </div>
                                            <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                                                <img src={occWithPay?.paymentProof || "https://placehold.co/600x400?text=Receipt+Image"} alt="Proof" className="w-full h-full object-cover"/>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setReviewPaymentId(null)} className="flex-1 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                                            <button onClick={() => handleVerify(reviewPaymentId, 'Rejected')} className="flex-1 py-2 bg-red-50 text-red-600 font-bold rounded-lg border border-red-200 hover:bg-red-100 flex items-center justify-center gap-2"><FileX size={18}/> Reject</button>
                                            <button onClick={() => handleVerify(reviewPaymentId, 'Verified')} className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"><Check size={18}/> Verify</button>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <>
                                <div className="bg-emerald-950 p-6 flex justify-between items-center text-white">
                                    <div><h3 className="text-2xl font-display font-bold">Room {room.room_number}</h3><p className="text-emerald-300 text-sm">{room.currentOccupants === 0 ? 'Vacant Unit' : 'Occupied Unit'}</p></div>
                                    <button onClick={() => setSelectedRoomId(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
                                </div>
                                <div className="p-6 space-y-6 overflow-y-auto">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Occupants & Payments</h4>
                                        {/* SCROLLABLE CONTAINER FOR OCCUPANTS */}
                                        <div className="max-h-[245px] overflow-y-auto pr-2 custom-scrollbar border border-gray-100 rounded-xl bg-gray-50/50 p-3">
                                            {roomData && roomData.occupants.length > 0 ? (
                                                <div className="space-y-3">
                                                    {roomData.occupantPaymentStatus.map((occ, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                                            <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">{occ.name.charAt(0)}</div><p className="text-sm font-bold text-gray-900">{occ.name}</p></div>
                                                            {occ.hasPendingPayment ? (
                                                                <button onClick={() => setReviewPaymentId(occ.paymentId || null)} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 shadow-sm flex items-center gap-1"><Eye size={12}/> Review</button>
                                                            ) : (
                                                                <span className={`px-2 py-1 rounded text-xs font-bold ${occ.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{occ.status}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center p-6 bg-white rounded-xl border border-dashed border-gray-300"><p className="text-gray-500 text-sm mb-3">Room is empty.</p><button onClick={() => { setSelectedRoomId(null); setCurrentView('tenants'); }} className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700">Assign Tenant</button></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* SCROLLABLE CONTAINER FOR ISSUES */}
                                    {roomData && roomData.activeIssues.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Active Issues</h4>
                                            <div className="max-h-[245px] overflow-y-auto pr-2 custom-scrollbar border border-red-100 rounded-xl bg-red-50/30 p-3">
                                                <div className="space-y-2">
                                                    {roomData.activeIssues.map(issue => (
                                                        <div key={issue.id} className={`p-3 rounded-xl flex justify-between items-center border bg-white shadow-sm ${getUrgencyStyles(issue.urgency)}`}>
                                                            <div>
                                                                <p className="text-sm font-bold">{issue.issueType}</p>
                                                                <p className="text-xs opacity-80 line-clamp-1">{issue.description}</p>
                                                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-black/5 text-current text-[10px] font-bold rounded uppercase">{issue.urgency}</span>
                                                            </div>
                                                            <button onClick={() => handleQuickResolve(issue.id)} className={`p-2 bg-white/80 rounded-lg hover:bg-white transition-colors text-current border border-current/20`}><CheckCircle2 size={18} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                    <button onClick={() => setSelectedRoomId(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Close</button>
                                    <button onClick={() => handleNavigationToRoom(room.room_number)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 flex items-center gap-2">Full Details <ArrowRight size={16}/></button>
                                </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

// HELPER STAT CARD
interface StatCardProps { title: string; value: string; icon: React.ReactNode; color: 'emerald' | 'blue' | 'amber' | 'violet'; onClick?: () => void; alert?: boolean; }
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, alert }) => {
    const colorStyles = { emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white", blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white", amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white", violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white" };
    return (
        <button onClick={onClick} className=" h-40 group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left w-full relative overflow-hidden">
            <div className="flex justify-between items-start mb-4"><div className={`p-3 rounded-xl transition-colors ${colorStyles[color]}`}>{icon}</div>{alert && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}</div>
            <div><h4 className="text-gray-500 text-sm font-medium mb-1 font-display">{title}</h4><p className="text-2xl font-display font-bold text-gray-900 group-hover:text-emerald-950 transition-colors">{value}</p></div>
        </button>
    );
};