// client/src/components/tenant/TenantChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../UserContext';
import { Send, MessageSquare, Trash2, Minimize2, Phone, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
    id: number;
    senderId: string;
    senderRole: 'landlord' | 'tenant';
    text: string;
    timestamp: Date;
}

interface TenantChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TenantChat: React.FC<TenantChatProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [landlordName, setLandlordName] = useState<string>('Landlord');
    const [landlordPhone, setLandlordPhone] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Housing Details & Connect Socket
    useEffect(() => {
        if (!user?.id || !isOpen) return;

        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tenant/details/${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error && data.landlordId) {
                    const generatedRoomId = `${data.landlordId}-${user.id}`;
                    setRoomId(generatedRoomId);
                    setLandlordName(data.landlordName);
                    setLandlordPhone(data.landlordPhone || null);

                    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
                    setSocket(newSocket);
                    newSocket.emit('join_room', generatedRoomId);

                    newSocket.on('receive_message', (msgData) => {
                        setMessages((prev) => [...prev, { 
                            id: msgData.tempId || Date.now(), 
                            senderId: msgData.senderId, 
                            senderRole: msgData.role, 
                            text: msgData.text, 
                            timestamp: new Date() 
                        }]);
                        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    });

                    newSocket.on('message_undone', (data) => {
                        setMessages((prev) => prev.filter(m => m.id !== data.messageId));
                    });

                    newSocket.on('chat_error', (error) => {
                        toast.error(error.message, { icon: '🛑' });
                    });
                }
            })
            .catch(() => toast.error("Failed to connect to chat server."));

        return () => { socket?.close(); };
    }, [user?.id, isOpen]);

    // 2. Send Message
    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !socket || !roomId || !user) return;

        const tempId = Date.now();
        const messageData = {
            roomId: roomId,
            senderId: user.id,
            role: 'tenant',
            text: newMessage.trim(),
            tempId: tempId 
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    // 3. Undo Message
    const undoMessage = (messageId: number) => {
        if (!socket || !roomId || !user) return;
        socket.emit('undo_message', { messageId, roomId, senderId: user.id });
        toast.success("Message recalled", { position: 'bottom-center' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[90vw] sm:w-[400px] h-[550px] max-h-[80vh] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 flex flex-col z-[100] animate-in slide-in-from-bottom-10 zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="h-16 bg-[#425042] text-white flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold border border-white/30 backdrop-blur-sm shrink-0">
                        {landlordName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <h2 className="font-bold text-white text-sm leading-tight truncate">{landlordName}</h2>
                        <div className="flex items-center gap-2 text-[11px] text-[#bac3ba]">
                            <span>Manager</span>
                            {landlordPhone && (
                                <>
                                    <span>•</span>
                                    <span className="font-mono">{landlordPhone}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {landlordPhone && (
                        <>
                            <a 
                                href={`tel:${landlordPhone}`} 
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                                title={`Call ${landlordPhone}`}
                            >
                                <Phone size={16} />
                            </a>
                            <a 
                                href={`sms:${landlordPhone}`} 
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                                title={`SMS ${landlordPhone}`}
                            >
                                <MessageCircle size={16} />
                            </a>
                        </>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white">
                        <Minimize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/80 backdrop-blur-sm">
                {!roomId ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading secure connection...</div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <MessageSquare size={28} className="text-[#657655]"/>
                        </div>
                        <p className="font-medium text-slate-600">Start a conversation</p>
                        <p className="text-xs text-center mt-1 max-w-[200px]">Ask your landlord about maintenance, rent, or house rules.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderRole === 'tenant';
                        return (
                            <div key={msg.id} className={`chat ${isMe ? 'chat-end' : 'chat-start'} mb-4 group`}>
                                <div className="chat-header text-[10px] text-slate-400 mb-1">
                                    <time className="opacity-50 ml-1">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isMe && (
                                        <button 
                                            onClick={() => undoMessage(msg.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-all shadow-sm"
                                            title="Undo Message"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                    <div className={`chat-bubble text-sm shadow-sm ${isMe ? 'bg-[#425042] text-white' : 'bg-white text-slate-800 border border-slate-100'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center shrink-0">
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#425042] transition-all text-slate-800"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-[#425042] hover:bg-[#344034] text-white rounded-full transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
};