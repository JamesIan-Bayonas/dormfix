// client/src/components/landlord/LandlordChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../UserContext';
import { Send, MicOff, ShieldAlert, MessageSquare, Clock, Phone, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatLastSeen } from '../../utils/presenceUtils';

interface Message {
    id: string;
    senderId: string;
    senderRole: 'landlord' | 'tenant';
    text: string;
    timestamp: Date;
}

interface ChatRoom {
    id: string;
    tenantId: string;
    tenantName: string;
    phoneNumber?: string | null;
    isMuted: boolean;
    isOnline: boolean;
    lastSeen: string | null;
}

export const LandlordChat: React.FC = () => {
    const { user, globalSocket } = useAuth();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Tenants & Initialize Room Presence
    useEffect(() => {
        if (user?.id) {
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/landlord/tenants/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    const approved = data.filter((t: any) => t.isApproved);
                    const chatRooms: ChatRoom[] = approved.map((t: any) => ({
                        id: `${user.id}-${t.id}`,
                        tenantId: t.id,
                        tenantName: t.name,
                        phoneNumber: t.phoneNumber || null,
                        isMuted: false,
                        isOnline: false,
                        lastSeen: t.createdAt
                    }));
                    setRooms(chatRooms);

                    approved.forEach((t: any) => {
                        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/presence/${t.id}`)
                            .then(r => r.json())
                            .then(presence => {
                                setRooms(prev => prev.map(room => 
                                    room.tenantId === t.id 
                                        ? { ...room, lastSeen: presence.lastSeen } 
                                        : room
                                ));
                            })
                            .catch(() => {});
                    });
                })
                .catch(() => toast.error("Failed to load chat contacts."));
        }
    }, [user?.id]);

    // 2. Real-Time Presence & Messaging Listeners
    useEffect(() => {
        if (!globalSocket) return;

        globalSocket.on('user_presence_update', (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
            setRooms(prev => prev.map(room => {
                if (room.tenantId === data.userId) {
                    return {
                        ...room,
                        isOnline: data.isOnline,
                        lastSeen: data.lastSeen
                    };
                }
                return room;
            }));

            if (activeRoom && activeRoom.tenantId === data.userId) {
                setActiveRoom(prev => prev ? {
                    ...prev,
                    isOnline: data.isOnline,
                    lastSeen: data.lastSeen
                } : null);
            }
        });

        globalSocket.on('receive_message', (data) => {
            setMessages(prev => [
                ...prev, 
                { 
                    id: data.id || Date.now().toString(), 
                    senderId: data.senderId, 
                    senderRole: data.role, 
                    text: data.text, 
                    timestamp: new Date(data.timestamp) 
                }
            ]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => {
            globalSocket.off('user_presence_update');
            globalSocket.off('receive_message');
        };
    }, [globalSocket, activeRoom]);

    // 3. Connect to Chat Channel & Load History
    const joinRoom = async (room: ChatRoom) => {
        if (globalSocket && activeRoom?.id !== room.id) {
            globalSocket.emit('join_room', room.id);
            setActiveRoom(room);
            setMessages([]);

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/history/${room.id}`);
                const history = await res.json();
                if (Array.isArray(history)) {
                    setMessages(history.map((m: any) => ({
                        id: m.id,
                        senderId: m.senderId,
                        senderRole: m.senderRole,
                        text: m.text,
                        timestamp: new Date(m.timestamp)
                    })));
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            } catch (err) {
                console.error("Failed to load history", err);
            }
        }
    };

    // 4. Send Message
    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !globalSocket || !activeRoom || !user) return;

        const messageData = {
            roomId: activeRoom.id,
            senderId: user.id,
            recipientId: activeRoom.tenantId,
            role: 'landlord',
            text: newMessage.trim(),
        };

        globalSocket.emit('send_message', messageData);
        setNewMessage('');
    };

    const toggleMute = () => {
        if (!activeRoom || !globalSocket) return;
        const newMuteStatus = !activeRoom.isMuted;
        globalSocket.emit('toggle_mute', { roomId: activeRoom.id, role: 'landlord', status: newMuteStatus });
        setActiveRoom({ ...activeRoom, isMuted: newMuteStatus });
        setRooms(rooms.map(r => r.id === activeRoom.id ? { ...r, isMuted: newMuteStatus } : r));
    };

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex h-[calc(100vh-12rem)] overflow-hidden animate-fade-in text-slate-800">
            {/* Contacts Column */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col bg-[#f8f9f5]">
                <div className="p-5 border-b border-gray-200/60 bg-white/60 backdrop-blur-md">
                    <h2 className="font-semibold text-base text-slate-800 flex items-center gap-2">
                        <MessageSquare size={16} className="text-[#657655]"/> Conversations
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    {rooms.map(room => {
                        const isCurrent = activeRoom?.id === room.id;
                        return (
                            <button 
                                key={room.id}
                                onClick={() => joinRoom(room)}
                                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between group outline-none
                                    ${isCurrent 
                                        ? 'bg-white border border-gray-200/80 shadow-xs' 
                                        : 'hover:bg-white/50 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="relative">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0
                                            ${isCurrent ? 'bg-[#e7efdb] text-[#3a4731]' : 'bg-white border border-gray-200 text-slate-500'}`}>
                                            {room.tenantName.charAt(0)}
                                        </div>
                                        {room.isOnline && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                                            {room.tenantName}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium tracking-wide">
                                            <span>{formatLastSeen(room.lastSeen, room.isOnline)}</span>
                                            {room.phoneNumber && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-mono text-slate-500 truncate">{room.phoneNumber}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {room.isMuted && <MicOff size={12} className="text-amber-600 shrink-0 ml-2" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat Conversation Pane */}
            {activeRoom ? (
                <div className="flex-1 flex flex-col bg-white relative">
                    <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-10 absolute top-0 w-full">
                        <div className="flex items-center gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-800 text-sm leading-tight">{activeRoom.tenantName}</span>
                                    {activeRoom.phoneNumber && (
                                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#f8f9f5] border border-gray-200 text-slate-600">
                                            {activeRoom.phoneNumber}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {formatLastSeen(activeRoom.lastSeen, activeRoom.isOnline)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {activeRoom.phoneNumber && (
                                <>
                                    <a 
                                        href={`tel:${activeRoom.phoneNumber}`}
                                        className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-xs"
                                        title={`Call ${activeRoom.phoneNumber}`}
                                    >
                                        <Phone size={14} />
                                    </a>
                                    <a 
                                        href={`sms:${activeRoom.phoneNumber}`}
                                        className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-xs"
                                        title={`SMS ${activeRoom.phoneNumber}`}
                                    >
                                        <MessageCircle size={14} />
                                    </a>
                                </>
                            )}
                            <button 
                                onClick={toggleMute}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all border outline-none
                                    ${activeRoom.isMuted 
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                        : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {activeRoom.isMuted ? <><MicOff size={12}/> Restricted</> : <><ShieldAlert size={12}/> Restrict Tenant</>}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pt-20 pb-24 bg-[#f8f9f5]/40 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <MessageSquare size={24} className="mb-2 opacity-40 text-slate-400"/>
                                <p className="text-xs font-medium text-slate-500">Secure conversation ledger initialized.</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Type a message below to start communicating.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => {
                                    const isMe = msg.senderRole === 'landlord';
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                                            <div className="flex items-center gap-1.5 px-2">
                                                <span className="text-[10px] font-bold text-slate-400">{isMe ? 'You' : activeRoom.tenantName}</span>
                                                <span className="text-[9px] text-slate-400 flex items-center gap-0.5 font-medium">
                                                    <Clock size={8}/>
                                                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <div className={`max-w-xs md:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs
                                                ${isMe 
                                                    ? 'bg-[#425042] text-white rounded-tr-xs' 
                                                    : 'bg-white text-slate-800 border border-gray-200 rounded-tl-xs'}`}
                                            >
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center absolute bottom-0 w-full">
                        <input 
                            type="text" 
                            placeholder="Type an administrative message..." 
                            className="flex-1 bg-[#f8f9f5] border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#425042] transition-all text-slate-800"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()}
                            className="p-2.5 bg-[#425042] hover:bg-[#344034] text-white rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed outline-none"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9f5]/30 text-slate-400">
                    <MessageSquare size={32} className="mb-3 opacity-20 text-[#425042]"/>
                    <h3 className="font-medium text-slate-700 text-sm">No Active Conversation Selected</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Select an active contact profile from the folder sidebar to fetch records.</p>
                </div>
            )}
        </div>
    );
};