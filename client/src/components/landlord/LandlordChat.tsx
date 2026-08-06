// client/src/components/landlord/LandlordChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../UserContext';
import { Send, MicOff, ShieldAlert, MessageSquare, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
    id: number;
    senderId: string;
    senderRole: 'landlord' | 'tenant';
    text: string;
    timestamp: Date;
}

interface ChatRoom {
    id: string;
    tenantId: string;
    tenantName: string;
    isMuted: boolean;
}

export const LandlordChat: React.FC = () => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Initialize Socket Connection
    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('receive_message', (data) => {
            setMessages((prev) => [
                ...prev, 
                { id: Date.now(), senderId: data.senderId, senderRole: data.role, text: data.text, timestamp: new Date() }
            ]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        newSocket.on('chat_error', (error) => {
            toast.error(error.message);
        });

        return () => { newSocket.close(); };
    }, []);

    // 2. Fetch Active Contacts
    useEffect(() => {
        if (user?.id) {
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/landlord/tenants/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    const chatRooms: ChatRoom[] = data
                        .filter((t: any) => t.isApproved)
                        .map((t: any) => ({
                            id: `${user.id}-${t.id}`,
                            tenantId: t.id,
                            tenantName: t.name,
                            isMuted: false
                        }));
                    setRooms(chatRooms);
                })
                .catch(() => toast.error("Failed to load chat contacts."));
        }
    }, [user?.id]);

    // 3. Connect to Chat Channel
    const joinRoom = (room: ChatRoom) => {
        if (socket && activeRoom?.id !== room.id) {
            socket.emit('join_room', room.id);
            setActiveRoom(room);
            setMessages([]); 
            toast.success(`Connected to ${room.tenantName}`);
        }
    };

    // 4. Send Communication Packet
    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !socket || !activeRoom || !user) return;

        const messageData = {
            roomId: activeRoom.id,
            senderId: user.id,
            role: 'landlord',
            text: newMessage.trim(),
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    // 5. Toggle Authority State (Mute Mappings)
    const toggleMute = () => {
        if (!activeRoom || !socket) return;
        
        const newMuteStatus = !activeRoom.isMuted;
        socket.emit('toggle_mute', { roomId: activeRoom.id, role: 'landlord', status: newMuteStatus });
        
        setActiveRoom({...activeRoom, isMuted: newMuteStatus});
        toast(newMuteStatus ? `Muted ${activeRoom.tenantName}` : `Unmuted ${activeRoom.tenantName}`, {
            icon: newMuteStatus ? '🔇' : '🔊'
        });
        
        setRooms(rooms.map(r => r.id === activeRoom.id ? {...r, isMuted: newMuteStatus} : r));
    };

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex h-[calc(100vh-12rem)] overflow-hidden animate-fade-in text-slate-800">
            
            {/* LEFT CONTACT LEDGER COMPONENT SHEET */}
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
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0 transition-colors
                                        ${isCurrent ? 'bg-[#e7efdb] text-[#3a4731]' : 'bg-white border border-gray-200 text-slate-500'}`}>
                                        {room.tenantName.charAt(0)}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                                            {room.tenantName}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium tracking-wide">Click to open ledger channel</p>
                                    </div>
                                </div>
                                {room.isMuted && <MicOff size={12} className="text-amber-600 shrink-0 ml-2" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT SIDE DIALOG WINDOW */}
            {activeRoom ? (
                <div className="flex-1 flex flex-col bg-white relative">
                    
                    {/* CHAT TERMINAL SUB-HEADER */}
                    <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-10 absolute top-0 w-full">
                        <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-800 text-sm">{activeRoom.tenantName}</span>
                            <span className="h-2 w-2 bg-[#5c6e4e] rounded-full"></span>
                        </div>
                        
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

                    {/* INTERACTION MESSAGES VIEW PANEL */}
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

                    {/* INPUT FORM ELEMENT BAR */}
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