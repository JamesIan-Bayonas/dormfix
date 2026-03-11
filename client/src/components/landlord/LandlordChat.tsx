import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../UserContext';
import { Send, User, MicOff, ShieldAlert, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

// Types
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
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('receive_message', (data) => {
            setMessages((prev) => [
                ...prev, 
                { id: Date.now(), senderId: data.senderId, senderRole: data.role, text: data.text, timestamp: new Date() }
            ]);
            // Auto-scroll to bottom
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        // 🛡️ Error handling from the backend authority engine
        newSocket.on('chat_error', (error) => {
            toast.error(error.message);
        });

        return () => { newSocket.close(); };
    }, []);

    // 2. Fetch Tenants to build Chat Rooms
    useEffect(() => {
        if (user?.id) {
            // Fetching approved tenants to act as chat rooms
            fetch(`http://localhost:5000/api/landlord/tenants/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    const chatRooms: ChatRoom[] = data
                        .filter((t: any) => t.isApproved)
                        .map((t: any) => ({
                            id: `${user.id}-${t.id}`, // Simplified Room ID for now
                            tenantId: t.id,
                            tenantName: t.name,
                            isMuted: false // Defaulting to false until hooked to DB
                        }));
                    setRooms(chatRooms);
                })
                .catch(() => toast.error("Failed to load chat contacts."));
        }
    }, [user?.id]);

    // 3. Join Room Logic
    const joinRoom = (room: ChatRoom) => {
        if (socket && activeRoom?.id !== room.id) {
            socket.emit('join_room', room.id);
            setActiveRoom(room);
            setMessages([]); // Clear previous messages
            
            // TODO: Fetch historical messages from SQL database here
            toast.success(`Connected to ${room.tenantName}`);
        }
    };

    // 4. Send Message Logic
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

    // 5. Mute Tenant Logic (Authority)
    const toggleMute = () => {
        if (!activeRoom || !socket) return;
        
        const newMuteStatus = !activeRoom.isMuted;
        socket.emit('toggle_mute', { roomId: activeRoom.id, role: 'landlord', status: newMuteStatus });
        
        setActiveRoom({...activeRoom, isMuted: newMuteStatus});
        toast(newMuteStatus ? `Muted ${activeRoom.tenantName}` : `Unmuted ${activeRoom.tenantName}`, {
            icon: newMuteStatus ? '🔇' : '🔊'
        });
        
        // Update room list state
        setRooms(rooms.map(r => r.id === activeRoom.id ? {...r, isMuted: newMuteStatus} : r));
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex h-[700px] overflow-hidden">
            
            {/* LEFT: Contact List */}
            <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-100 bg-white">
                    <h2 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
                        <MessageSquare size={20} className="text-emerald-600"/> Messages
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {rooms.map(room => (
                        <button 
                            key={room.id}
                            onClick={() => joinRoom(room)}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group
                                ${activeRoom?.id === room.id ? 'bg-emerald-50 border border-emerald-100 shadow-sm' : 'hover:bg-white border border-transparent hover:border-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 transition-colors
                                    ${activeRoom?.id === room.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}>
                                    {room.tenantName.charAt(0)}
                                </div>
                                <div>
                                    <p className={`font-semibold text-sm ${activeRoom?.id === room.id ? 'text-emerald-900' : 'text-slate-700'}`}>
                                        {room.tenantName}
                                    </p>
                                    <p className="text-xs text-slate-400">Tap to view chat</p>
                                </div>
                            </div>
                            {room.isMuted && <MicOff size={14} className="text-amber-500" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: Active Chat Window */}
            {activeRoom ? (
                <div className="flex-1 flex flex-col bg-white relative">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-10 absolute top-0 w-full">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800">{activeRoom.tenantName}</span>
                        </div>
                        
                        {/* 🛡️ AUTHORITY: Mute Toggle Button */}
                        <button 
                            onClick={toggleMute}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                ${activeRoom.isMuted 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            {activeRoom.isMuted ? <><MicOff size={14}/> Muted</> : <><ShieldAlert size={14}/> Mute Tenant</>}
                        </button>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 pt-24 bg-slate-50/30">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <MessageSquare size={32} className="mb-2 opacity-50"/>
                                <p className="text-sm">No recent messages.</p>
                                <p className="text-xs">Start the conversation below.</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.senderRole === 'landlord';
                                return (
                                    /* 🛡️ DaisyUI Chat Bubbles */
                                    <div key={msg.id} className={`chat ${isMe ? 'chat-end' : 'chat-start'} mb-2 animate-fade-in`}>
                                        <div className="chat-image avatar">
                                            <div className="w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {isMe ? 'You' : activeRoom.tenantName.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="chat-header text-xs text-slate-400 mb-1">
                                            {isMe ? 'You' : activeRoom.tenantName}
                                            <time className="text-xs opacity-50 ml-1">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                                        </div>
                                        <div className={`chat-bubble text-sm shadow-sm ${isMe ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800 border border-slate-100'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input Form */}
                    <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-3 items-center">
                        <input 
                            type="text" 
                            placeholder="Type a message..." 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-slate-800"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()}
                            className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 text-slate-400">
                    <MessageSquare size={48} className="mb-4 opacity-20"/>
                    <h3 className="font-medium text-slate-600">No Chat Selected</h3>
                    <p className="text-sm mt-1">Select a tenant from the list to start messaging.</p>
                </div>
            )}
        </div>
    );
};