import { Dialog } from '../ui/Dialog';
import { ErrorMessage } from '../ui/Feedback';
import { WorkspaceShell } from '../ui/WorkspaceShell';
import { TenantHome } from '../tenant/TenantHome';
// client/src/components/dashboards/TenantDashboard.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, ArrowLeft, Send, Lock, Phone, MessageCircle } from 'lucide-react';
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
    const [housingError, setHousingError] = useState<string | null>(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    
    // Profile Edit State
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phoneNumber || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

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
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditPhone(user.phoneNumber || '');
        }
    }, [user]);

    const loadHousing = useCallback(async () => {
        if (!user?.id) return;
        setIsLoadingHousing(true);
        setHousingError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tenant/details/${user.id}`);
            const data = await res.json();
            if (!res.ok || !data || data.error) throw new Error('Housing details unavailable');
            setHousing(data);
        } catch {
            setHousing(null);
            setHousingError('Your room and landlord details could not be loaded. Please try again.');
        } finally { setIsLoadingHousing(false); }
    }, [user?.id]);
    useEffect(() => { loadHousing(); }, [loadHousing]);

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
        setProfileError(null);
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
        } catch (err: unknown) {
            setProfileError(err instanceof Error ? err.message : "Failed to update profile.");
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
        setSubmissionError(null);
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
        } catch (error: unknown) {
            console.error(error);
            setSubmissionError(error instanceof Error ? error.message : "Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <WorkspaceShell role="tenant" user={user} onLogout={logout} onEditProfile={() => setIsEditProfileOpen(true)}>
        <Routes>
            <Route path="/history" element={
                isRoomAssigned ? (
                    <div className="space-y-6">
                        <div className="space-y-6">
                            <TenantPaymentHistory onBack={() => navigate('/')} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="p-6 bg-white border border-gray-200 rounded-[2rem] max-w-sm space-y-3 shadow-sm">
                            <Lock className="mx-auto text-amber-600" size={32} />
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Access Restricted</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Transaction history is unavailable until your landlord assigns your unit.</p>
                            <button onClick={() => navigate('/')} className="px-4 py-2 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors">Back to home</button>
                        </div>
                    </div>
                )
            } />

            <Route path="/chat" element={
                <div className="space-y-6">
                    <div className="mx-auto flex min-h-[28rem] max-w-3xl flex-col gap-4 h-[calc(100dvh-12rem)]">
                        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-bold text-[#5c6e4e] uppercase tracking-wider hover:text-[#425042] transition-colors outline-none shrink-0">
                            <ArrowLeft size={14} /> Back to home
                        </button>
                        <div className="border-b border-gray-200/60 pb-3 shrink-0 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-serif text-slate-800">Message landlord</h1>
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
                                    placeholder="Type a message..."
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
                <div className="space-y-6">
                    <TenantHome user={user} housing={housing} loading={isLoadingHousing} error={housingError}
                        onRetry={loadHousing} onRules={() => setIsRulesModalOpen(true)} onEditProfile={() => setIsEditProfileOpen(true)}>
                        <MaintenanceList />
                    </TenantHome>

                    {activeModal === 'maintenance' && (
                        <Dialog open onClose={() => navigate('/')} title="Report an issue" busy={isSubmitting}>


                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {submissionError && <ErrorMessage>{submissionError}</ErrorMessage>}
                                    <div>
                                        <label htmlFor="repair-category" className="block text-sm font-semibold text-ink mb-2">Issue Category</label>
                                        <select id="repair-category" disabled={isSubmitting} className="df-control" value={formData.issueType} onChange={e => setFormData({...formData, issueType: e.target.value})}>
                                            <option value="Plumbing">Plumbing</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="Appliance">Appliance</option>
                                            <option value="Structural">Structural</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="repair-urgency" className="block text-sm font-semibold text-ink mb-2">Urgency Level</label>
                                        <select id="repair-urgency" disabled={isSubmitting} className="df-control" value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})}>
                                            <option value="Low">Low (Can wait)</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High (Needs attention)</option>
                                            <option value="Emergency">Emergency (Immediate action)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="repair-description" className="block text-sm font-semibold text-ink mb-2">Detailed Description</label>
                                        <textarea id="repair-description" disabled={isSubmitting} required className="df-control" placeholder="Describe the issue..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="df-button df-button--primary">{isSubmitting ? 'Filing...' : 'Submit Request'}</button>
                                </form>

                        </Dialog>
                    )}

                    {activeModal === 'payment' && (
                        <Dialog open onClose={() => navigate('/')} title="Submit payment proof" busy={isPaymentSubmitting}>


                                {housing?.landlordId ? <TenantPaymentForm landlordId={housing.landlordId} onBusyChange={setIsPaymentSubmitting} onSuccess={() => navigate('/')} /> : <div className="bg-white p-6 rounded-xl text-center text-red-600 font-bold">Error: Connection severed.</div>}

                        </Dialog>
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
        {/* Edit profile remains available across tenant routes. */}
        {isEditProfileOpen && (
            <Dialog open onClose={() => setIsEditProfileOpen(false)} title="Edit profile" busy={isUpdatingProfile}>


                    <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                        {profileError && <ErrorMessage>{profileError}</ErrorMessage>}
                        <div>
                            <label htmlFor="profile-name" className="block text-sm font-semibold text-ink mb-2">Full Name</label>
                            <input id="profile-name" disabled={isUpdatingProfile}
                                type="text"
                                required
                                className="df-control"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="profile-phone" className="block text-sm font-semibold text-ink mb-2">Phone Number</label>
                            <input id="profile-phone" disabled={isUpdatingProfile}
                                type="tel"
                                placeholder="09123456789"
                                className="df-control"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                disabled={isUpdatingProfile} onClick={() => setIsEditProfileOpen(false)}
                                className="df-button df-button--secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdatingProfile || !editName.trim()}
                                className="df-button df-button--primary"
                            >
                                {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

            </Dialog>
        )}

        </WorkspaceShell>
    );
};
