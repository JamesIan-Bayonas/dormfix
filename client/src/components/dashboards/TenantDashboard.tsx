// client/src/components/dashboards/TenantDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
    MessageSquare, Home, LogOut, Wrench, CreditCard, X, User, 
    Calendar, Mail, ArrowRight, ArrowLeft, Send, Lock, AlertCircle, ShieldCheck,
    Phone, Edit3,
    MessageCircle
} from 'lucide-react'; 
import { useAuth } from '../UserContext';
import { MaintenanceList } from '../MaintenanceList';
import { TenantPaymentForm } from '../tenant/TenantPaymentForm'; 
import { TenantPaymentHistory } from '../tenant/TenantPaymentHistory';
import { TenantRulesModal } from '../tenant/TenantRulesModal';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatLastSeen } from '../../utils/presenceUtils';

interface HousingDetails {
    landlordId: string;
    landlordName: string;
    landlordEmail: string;
    landlordPhone?: string | null;
    roomNumber: string;
    moveInDate: string;
}

interface SocketMessage {
    id: number | string;
    senderId: string;
    senderRole: 'landlord' | 'tenant';
    text: string;
    timestamp: Date;
}

export const TenantDashboard: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [housing, setHousing] = useState<HousingDetails | null>(null);
    const [isLoadingHousing, setIsLoadingHousing] = useState(true);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    
    // Profile Edit State
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phoneNumber || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Core Isolated Dedicated Chat States
    const [socket, setSocket] = useState<Socket | null>(null);
    const [chatMessages, setChatMessages] = useState<SocketMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [landlordPresence, setLandlordPresence] = useState<{ isOnline: boolean; lastSeen: string | null }>({
        isOnline: false,
        lastSeen: null
    });

    const [formData, setFormData] = useState({
        issueType: 'Plumbing',
        urgency: 'Low',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditPhone(user.phoneNumber || '');
        }
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            setIsLoadingHousing(true);
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tenant/details/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) setHousing(data);
                })
                .catch(err => {
                    console.error("Failed to load housing context:", err);
                    toast.error("Failed to connect to housing profile server.");
                })
                .finally(() => setIsLoadingHousing(false)); 
        }
    }, [user?.id]);

    const isRoomAssigned = Boolean(housing?.roomNumber && housing.roomNumber !== 'Unassigned');

    const activeModal = (location.pathname.includes('/pay') && isRoomAssigned) 
        ? 'payment' 
        : (location.pathname.includes('/report') && isRoomAssigned) 
            ? 'maintenance' 
            : null;

    useEffect(() => {
        if (!user?.id || !housing?.landlordId || !location.pathname.includes('/chat')) return;

        const channelRoomId = `${housing.landlordId}-${user.id}`;
        const activeSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        setSocket(activeSocket);

        activeSocket.emit('register_user', user.id);
        activeSocket.emit('join_room', channelRoomId);

        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/history/${channelRoomId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setChatMessages(data.map((m: any) => ({
                        id: m.id,
                        senderId: m.senderId,
                        senderRole: m.senderRole,
                        text: m.text,
                        timestamp: new Date(m.timestamp)
                    })));
                    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            })
            .catch(() => {});

        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/presence/${housing.landlordId}`)
            .then(r => r.json())
            .then(p => setLandlordPresence({ isOnline: false, lastSeen: p.lastSeen }))
            .catch(() => {});

        activeSocket.on('user_presence_update', (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
            if (data.userId === housing.landlordId) {
                setLandlordPresence({ isOnline: data.isOnline, lastSeen: data.lastSeen });
            }
        });

        activeSocket.on('receive_message', (payload) => {
            setChatMessages(prev => [...prev, {
                id: payload.id || Date.now().toString(),
                senderId: payload.senderId,
                senderRole: payload.role,
                text: payload.text,
                timestamp: new Date(payload.timestamp)
            }]);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => {
            activeSocket.disconnect();
        };
    }, [user?.id, housing?.landlordId, location.pathname]);

    const handleSendChatMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !socket || !user || !housing) return;

        socket.emit('send_message', {
            roomId: `${housing.landlordId}-${user.id}`,
            senderId: user.id,
            role: 'tenant',
            text: chatInput.trim(),
            tempId: Date.now()
        });
        setChatInput('');
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !editName.trim()) return;

        setIsUpdatingProfile(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/profile/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    phoneNumber: editPhone.trim() || null
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Profile update failed");

            updateUser(data.user);
            toast.success("Profile updated successfully!");
            setIsEditProfileOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile.");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isRoomAssigned) {
            toast.error("You cannot report issues until a room has been assigned.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/maintenance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: user?.id, ...formData })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Submission failed");
            toast.success("Request sent to landlord successfully!");
            setFormData({ issueType: 'Plumbing', urgency: 'Low', description: '' }); 
            navigate('/');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <Routes>
            <Route path="/history" element={
                isRoomAssigned ? (
                    <div className="min-h-screen bg-[#f8f9f5] p-4 animate-fade-in text-slate-800">
                        <div className="max-w-4xl mx-auto py-8">
                            <TenantPaymentHistory onBack={() => navigate('/')} />
                        </div>
                    </div>
                ) : (
                    <div className="min-h-screen bg-[#f8f9f5] p-6 flex flex-col items-center justify-center text-center">
                        <div className="p-6 bg-white border border-gray-200 rounded-[2rem] max-w-sm space-y-3 shadow-sm">
                            <Lock className="mx-auto text-amber-600" size={32} />
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Access Restricted</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Transaction history is unavailable until your landlord assigns your unit.</p>
                            <button onClick={() => navigate('/')} className="px-4 py-2 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors">Return to Portal</button>
                        </div>
                    </div>
                )
            } />

            <Route path="/chat" element={
                <div className="min-h-screen bg-[#f8f9f5] p-4 sm:p-8 animate-fade-in text-slate-800">
                    <div className="max-w-3xl mx-auto space-y-6 flex flex-col h-[calc(100vh-4rem)]">
                        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-bold text-[#5c6e4e] uppercase tracking-wider hover:text-[#425042] transition-colors outline-none shrink-0">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </button>
                        <div className="border-b border-gray-200/60 pb-3 shrink-0 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-serif text-slate-800">Property Manager Chat</h1>
                                <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${landlordPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                    <span>{housing?.landlordName || 'Landlord'} • {formatLastSeen(landlordPresence.lastSeen, landlordPresence.isOnline)}</span>
                                    {housing?.landlordPhone && (
                                        <>
                                            <span>•</span>
                                            <span className="font-mono text-slate-600 font-medium">{housing.landlordPhone}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {housing?.landlordPhone && (
                                <div className="flex items-center gap-2">
                                    <a 
                                        href={`tel:${housing.landlordPhone}`}
                                        className="px-3 py-1.5 bg-white border border-gray-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-xs inline-flex items-center gap-1.5"
                                        title={`Call ${housing.landlordPhone}`}
                                    >
                                        <Phone size={13} className="text-[#5c6e4e]" /> Call Line
                                    </a>
                                    <a 
                                        href={`sms:${housing.landlordPhone}`}
                                        className="px-3 py-1.5 bg-white border border-gray-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-xs inline-flex items-center gap-1.5"
                                        title={`SMS ${housing.landlordPhone}`}
                                    >
                                        <MessageCircle size={13} className="text-[#5c6e4e]" /> Send SMS
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-0">
                            <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9f5]/30 custom-scrollbar space-y-4">
                                {chatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <MessageSquare size={24} className="mb-2 text-slate-300" />
                                        <p className="text-xs font-semibold">No recent messages logged.</p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, index) => {
                                        const isMe = msg.senderRole === 'tenant';
                                        return (
                                            <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                                                <span className="text-[9px] font-bold text-slate-400 px-1">{isMe ? 'You' : housing?.landlordName}</span>
                                                <div className={`max-w-xs p-3 rounded-2xl text-xs shadow-xs leading-relaxed ${isMe ? 'bg-[#425042] text-white rounded-tr-none' : 'bg-white text-slate-800 border border-gray-200 rounded-tl-none'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center shrink-0">
                                <input 
                                    type="text" 
                                    placeholder="Type an administrative message..." 
                                    className="flex-1 bg-[#f8f9f5] border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#425042] text-slate-800"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                />
                                <button type="submit" disabled={!chatInput.trim() || !socket} className="p-2.5 bg-[#425042] hover:bg-[#344034] text-white rounded-xl transition-all disabled:opacity-40 outline-none">
                                    <Send size={14} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            } />

            <Route path="*" element={
                <div className="min-h-screen bg-[#f8f9f5] relative text-slate-800 font-sans">
                    <header className="bg-white border-b border-gray-200/60 sticky top-0 z-10">
                        <div className="max-w-5xl mx-auto py-4 px-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#425042] rounded-xl shadow-xs"><Home size={18} className="text-white" /></div>
                                <div>
                                    <h1 className="text-2xl font-serif text-slate-800 leading-none mt-1">Tenant Portal</h1>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 hidden sm:block">
                                        Welcome, <span className="text-slate-700 font-semibold">{user.name}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setIsEditProfileOpen(true)}
                                    className="flex items-center gap-2.5 px-3 py-1.5 bg-[#f8f9f5] hover:bg-[#e7efdb]/40 rounded-xl border border-gray-200/60 shadow-xs transition-colors cursor-pointer outline-none"
                                    title="Edit Profile"
                                >
                                    <div className="h-7 w-7 rounded-full bg-[#425042] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <div className="text-xs font-bold text-slate-800 leading-none">{user.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.dormFixId}</div>
                                    </div>
                                    <Edit3 size={12} className="text-slate-400 ml-1 hidden sm:block" />
                                </button>

                                <button onClick={logout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#cc4747] transition-colors outline-none cursor-pointer">
                                    <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    <main className="max-w-5xl mx-auto py-10 px-6">
                        {!isLoadingHousing && !isRoomAssigned && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-3 shadow-xs">
                                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Unit Allocation Pending</h4>
                                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                        Your account is approved, but your landlord has not assigned your specific room unit yet. Rent payments and maintenance reporting are disabled until your unit is confirmed.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-6 border-b border-gray-100">
                                <div className="flex items-center gap-3.5">
                                    <div className="h-12 w-12 rounded-full bg-[#e7efdb] text-[#3a4731] border border-[#d3e0c0] flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-serif font-bold text-slate-800 leading-tight">{user.name}</h2>
                                            <span className="px-2.5 py-0.5 bg-[#e7efdb] text-[#5c6e4e] text-[9px] font-bold rounded-full uppercase tracking-wider border border-[#d3e0c0]">
                                                Tenant
                                            </span>
                                            <button 
                                                onClick={() => setIsEditProfileOpen(true)} 
                                                className="p-1 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                                                title="Edit Profile"
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                            <span className="flex items-center gap-1 text-slate-500"><Mail size={12} className="text-slate-400" /> {user.email}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 text-slate-500"><Phone size={12} className="text-slate-400" /> {user.phoneNumber || <span className="italic text-slate-400">No phone set</span>}</span>
                                            <span>•</span>
                                            <span>Token ID: <b className="font-mono text-slate-700 font-semibold">{user.dormFixId}</b></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={15} className="text-[#657655]"/> Housing & Landlord Allocation
                            </h3>

                            {isLoadingHousing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[1, 2, 3].map((idx) => (
                                        <div key={idx} className="p-5 bg-gray-50 rounded-2xl skeleton h-20"></div>
                                    ))}
                                </div>
                            ) : housing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
                                    <div className="p-5 bg-[#f8f9f5] rounded-2xl border border-gray-200/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Managed By</span>
                                        <div className="font-medium text-slate-800 mt-1.5 text-sm">{housing.landlordName}</div>
                                        <div className="text-[11px] text-[#5c6e4e] flex items-center gap-1 mt-1 font-medium"><Mail size={12} /> {housing.landlordEmail}</div>
                                    </div>
                                    <div className="p-5 bg-[#f8f9f5] rounded-2xl border border-gray-200/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Unit</span>
                                        <div className={`font-serif font-bold mt-1 text-xl ${isRoomAssigned ? 'text-slate-800' : 'text-amber-600'}`}>
                                            {isRoomAssigned ? `Room ${housing.roomNumber}` : 'Unassigned'}
                                        </div>
                                    </div>
                                    <div className="p-5 bg-[#f8f9f5] rounded-2xl border border-gray-200/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenancy Start</span>
                                        <div className="font-medium text-slate-800 mt-1.5 flex items-center gap-1.5 text-sm"><Calendar size={14} className="text-[#657655]"/>{new Date(housing.moveInDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-amber-700 text-xs font-medium bg-amber-50 p-4 rounded-xl border border-amber-200/60">No housing details found. Please contact your property manager to link your account.</div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                            <button onClick={() => navigate('/chat')} className="group flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#b7c4a9] hover:shadow-md transition-all outline-none">
                                <div className="p-4 bg-[#e7efdb] rounded-full mb-4 group-hover:-translate-y-1 transition-transform border border-[#d3e0c0]"><MessageSquare size={28} className="text-[#5c6e4e]" /></div>
                                <span className="text-base font-semibold text-slate-800">Message Landlord</span>
                                <span className="text-[11px] text-slate-400 font-medium mt-1">Live Chat Support</span>
                            </button>

                            <button onClick={() => setIsRulesModalOpen(true)} className="group flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#b7c4a9] hover:shadow-md transition-all outline-none">
                                <div className="p-4 bg-[#e7efdb] rounded-full mb-4 group-hover:-translate-y-1 transition-transform border border-[#d3e0c0]"><ShieldCheck size={28} className="text-[#5c6e4e]" /></div>
                                <span className="text-base font-semibold text-slate-800">House Directives</span>
                                <span className="text-[11px] text-slate-400 font-medium mt-1">Building Rules & Policies</span>
                            </button>

                            {isRoomAssigned ? (
                                <button onClick={() => navigate('/report')} className="group flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all outline-none">
                                    <div className="p-4 bg-[#fef9eb] rounded-full mb-4 group-hover:-translate-y-1 transition-transform border border-[#f5ead0]"><Wrench size={28} className="text-[#b97a26]" /></div>
                                    <span className="text-base font-semibold text-slate-800">Report Issue</span>
                                    <span className="text-[11px] text-slate-400 font-medium mt-1">Maintenance & Repairs</span>
                                </button>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 bg-gray-50/80 rounded-[2rem] border border-dashed border-gray-200 cursor-not-allowed opacity-75">
                                    <div className="p-4 bg-gray-100 rounded-full mb-4 text-slate-400"><Lock size={28} /></div>
                                    <span className="text-base font-semibold text-slate-400">Report Issue</span>
                                    <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                        <AlertCircle size={10} /> Requires Room Assignment
                                    </span>
                                </div>
                            )}

                            {isRoomAssigned ? (
                                <div className="group flex flex-col bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#425042]/30 hover:shadow-md transition-all overflow-hidden h-full">
                                    <button onClick={() => navigate('/pay')} className="flex-1 flex flex-col items-center justify-center p-6 outline-none">
                                        <div className="p-4 bg-[#425042] rounded-full mb-4 group-hover:-translate-y-1 transition-transform shadow-xs"><CreditCard size={28} className="text-white" /></div>
                                        <span className="text-base font-semibold text-slate-800">Pay Rent</span>
                                        <span className="text-[11px] text-slate-400 font-medium mt-1">Upload Digital Receipt</span>
                                    </button>
                                    <button onClick={() => navigate('/history')} className="w-full py-3 bg-[#f8f9f5] border-t border-gray-100 text-[10px] font-bold uppercase tracking-wider text-[#5c6e4e] hover:bg-[#e7efdb] transition-colors outline-none flex items-center justify-center gap-1">
                                        View Ledger History <ArrowRight size={12}/>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col bg-gray-50/80 rounded-[2rem] border border-dashed border-gray-200 overflow-hidden h-full opacity-75 select-none cursor-not-allowed">
                                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                                        <div className="p-4 bg-gray-100 rounded-full mb-4 text-slate-400"><Lock size={28} /></div>
                                        <span className="text-base font-semibold text-slate-400">Pay Rent</span>
                                        <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                            <AlertCircle size={10} /> Requires Room Assignment
                                        </span>
                                    </div>
                                    <div className="w-full py-3 bg-gray-100/60 border-t border-gray-200 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                                        <Lock size={10} /> History Locked
                                    </div>
                                </div>
                            )}
                        </div>                        

                        <MaintenanceList /> 
                    </main>

                    {/* EDIT PROFILE MODAL */}
                    {isEditProfileOpen && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in">
                            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 p-6 space-y-4 bg-[#f8f9f5]">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                                    <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2">
                                        <Edit3 size={16} className="text-[#5c6e4e]" /> Edit Profile Details
                                    </h3>
                                    <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-600 outline-none">
                                        <X size={18} />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-[#425042]"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                                        <input 
                                            type="tel" 
                                            placeholder="09123456789"
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-[#425042]"
                                            value={editPhone}
                                            onChange={(e) => setEditPhone(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsEditProfileOpen(false)} 
                                            className="flex-1 py-2 bg-gray-50 border border-gray-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-gray-100"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={isUpdatingProfile || !editName.trim()} 
                                            className="flex-1 py-2 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                                        >
                                            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeModal === 'maintenance' && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in">
                            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-8 space-y-5 bg-[#f8f9f5]">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <h3 className="font-semibold text-base text-slate-800">New Maintenance Ticket</h3>
                                    <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 outline-none"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Category</label>
                                        <select className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-slate-700 outline-none" value={formData.issueType} onChange={e => setFormData({...formData, issueType: e.target.value})}>
                                            <option value="Plumbing">Plumbing</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="Appliance">Appliance</option>
                                            <option value="Structural">Structural</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Urgency Level</label>
                                        <select className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-slate-700 outline-none" value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})}>
                                            <option value="Low">Low (Can wait)</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High (Needs attention)</option>
                                            <option value="Emergency">Emergency (Immediate action)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detailed Description</label>
                                        <textarea required className="w-full p-3 bg-white border border-gray-200 rounded-xl text-slate-700 text-xs font-medium outline-none min-h-[100px]" placeholder="Describe the issue..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold rounded-xl shadow-sm transition-all">{isSubmitting ? 'Filing...' : 'Submit Request'}</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeModal === 'payment' && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in">
                            <div className="relative w-full max-w-lg">
                                <button onClick={() => navigate('/')} className="absolute -top-10 right-0 text-white font-bold bg-[#425042] px-3 py-1 rounded-full text-xs">Close [X]</button>
                                {housing?.landlordId ? <TenantPaymentForm landlordId={housing.landlordId} onSuccess={() => navigate('/')} /> : <div className="bg-white p-6 rounded-xl text-center text-red-600 font-bold">Error: Connection severed.</div>}
                            </div>
                        </div>
                    )}

                    {housing?.landlordId && (
                        <TenantRulesModal 
                            isOpen={isRulesModalOpen}
                            onClose={() => setIsRulesModalOpen(false)}
                            landlordId={housing.landlordId}
                            roomNumber={housing.roomNumber}
                        />
                    )}
                </div>
            } />
        </Routes>
    );
};