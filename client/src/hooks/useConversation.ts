import { useCallback, useEffect, useRef, useState } from 'react';
import { chatBody, chatMessage, mergeChatMessages, type ChatMessage, type ConversationScope } from '../utils/chatPresentation';

export interface MessagingSocket {
    connected: boolean;
    on(event: string, listener: (payload: unknown) => void): unknown;
    off(event: string, listener: (payload: unknown) => void): unknown;
    emit(event: string, payload: unknown): unknown;
    connect(): unknown;
}
export type HistoryLoader = (roomId: string, signal: AbortSignal) => Promise<unknown>;
export type PresenceLoader = (peerId: string, signal: AbortSignal) => Promise<unknown>;
const api = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const readHistory: HistoryLoader = async (roomId, signal) => {
    const response = await fetch(`${api}/api/chat/history/${encodeURIComponent(roomId)}`, { signal });
    if (!response.ok) throw new Error('History unavailable');
    return response.json();
};
const readPresence: PresenceLoader = async (peerId, signal) => {
    const response = await fetch(`${api}/api/chat/presence/${encodeURIComponent(peerId)}`, { signal });
    if (!response.ok) throw new Error('Presence unavailable');
    return response.json();
};
// In-memory only, scoped to the account and conversation. No draft is auto-sent.
const drafts = new Map<string, string>();
const submittedDrafts = new Map<string, string>();
interface Options extends ConversationScope { socket: MessagingSocket | null; loadHistory?: HistoryLoader; loadPresence?: PresenceLoader }

export function useConversation({ socket, loadHistory = readHistory, loadPresence = readPresence, roomId, userId, peerId, role }: Options) {
    const key = `${userId}:${roomId}`;
    const [draft, setDraftState] = useState(() => drafts.get(key) || '');
    const [submitted, setSubmitted] = useState<string | null>(() => submittedDrafts.get(key) || null);
    const lastSubmitted = useRef<string | null>(submittedDrafts.get(key) || null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [connection, setConnection] = useState<'connecting' | 'connected' | 'disconnected'>(socket?.connected ? 'connected' : 'connecting');
    const [loading, setLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);
    const [presence, setPresence] = useState<{ online: boolean | null; lastSeen: string | null }>({ online: null, lastSeen: null });
    const request = useRef(0);
    const historyAbort = useRef<AbortController | null>(null);
    const alive = useRef(false);
    const presenceVersion = useRef(0);

    const refresh = useCallback(async () => {
        const sequence = ++request.current;
        historyAbort.current?.abort();
        const controller = new AbortController();
        historyAbort.current = controller;
        setLoading(true);
        setHistoryError(null);
        try {
            const data = await loadHistory(roomId, controller.signal);
            if (!Array.isArray(data)) throw new Error('Invalid history');
            if (!alive.current || sequence !== request.current) return;
            const scope = { roomId, userId, peerId, role };
            const history = data.map(value => chatMessage(value, scope, true)).filter((value): value is ChatMessage => value !== null);
            setMessages(previous => mergeChatMessages(previous, history));
        } catch {
            if (alive.current && sequence === request.current && !controller.signal.aborted)
                setHistoryError('Message history could not be loaded. Your draft and any messages already shown are kept.');
        } finally { if (alive.current && sequence === request.current) setLoading(false); }
    }, [loadHistory, roomId, userId, peerId, role]);

    useEffect(() => {
        alive.current = true;
        const scope = { roomId, userId, peerId, role };
        const connected = () => {
            setConnection('connected');
            setPresence({ online: null, lastSeen: null });
            // Tenant keeps its existing dedicated socket registration. Landlord
            // registration stays in the unchanged auth provider.
            if (role === 'tenant') socket?.emit('register_user', userId);
            socket?.emit('join_room', roomId);
            socket?.emit('check_presence', peerId);
            void refresh();
        };
        const disconnected = () => { setConnection('disconnected'); setPresence({ online: null, lastSeen: null }); };
        const received = (payload: unknown) => {
            const message = chatMessage(payload, scope, false);
            if (message) setMessages(previous => mergeChatMessages(previous, [message]));
            else if (role === 'landlord' && payload && typeof payload === 'object' &&
                (payload as Record<string, unknown>).senderId === userId) void refresh();
        };
        const error = (payload: unknown) => {
            const message = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).message : null;
            setNotice(typeof message === 'string' ? message : 'A messaging notice was received.');
        };
        const changedPresence = (payload: unknown) => {
            if (!payload || typeof payload !== 'object') return;
            const data = payload as Record<string, unknown>;
            if (data.userId !== peerId || typeof data.isOnline !== 'boolean') return;
            presenceVersion.current++;
            setPresence(previous => ({ online: data.isOnline as boolean,
                lastSeen: typeof data.lastSeen === 'string' ? data.lastSeen : previous.lastSeen }));
        };
        const events = { connect: connected, disconnect: disconnected, connect_error: disconnected,
            receive_message: received, chat_error: error, user_presence_update: changedPresence, presence_status: changedPresence };
        for (const [event, handler] of Object.entries(events)) socket?.on(event, handler);
        if (socket?.connected) connected(); else { setConnection('connecting'); void refresh(); }
        const controller = new AbortController();
        const version = presenceVersion.current;
        loadPresence(peerId, controller.signal)
            .then((data: unknown) => {
                if (!alive.current || controller.signal.aborted || version !== presenceVersion.current || !data || typeof data !== 'object') return;
                const lastSeen = (data as Record<string, unknown>).lastSeen;
                if (typeof lastSeen === 'string') setPresence(previous => ({ ...previous, lastSeen }));
            }).catch(() => {});
        return () => {
            alive.current = false;
            controller.abort();
            historyAbort.current?.abort();
            for (const [event, handler] of Object.entries(events)) socket?.off(event, handler);
        };
    }, [socket, roomId, userId, peerId, role, refresh, loadPresence]);

    function setDraft(value: string) { drafts.set(key, value); setDraftState(value); setSendError(null); }
    function newDraft() { setDraft(''); submittedDrafts.delete(key); lastSubmitted.current = null; setSubmitted(null); }
    function send() {
        if (!socket?.connected) { setSendError('You are disconnected. Your draft is kept. Reconnect before sending.'); return; }
        if (!draft.trim() || loading || lastSubmitted.current === draft.trim()) return;
        try {
            socket.emit('send_message', chatBody({ roomId, userId, peerId, role }, draft, Date.now()));
            lastSubmitted.current = draft.trim();
            submittedDrafts.set(key, draft.trim());
            setSubmitted(draft.trim());
            setSendError(null);
        } catch { setSendError('The message could not be submitted. Your draft is kept.'); }
    }
    return { messages, draft, setDraft, newDraft, send, submitted, connection, loading, historyError, notice, sendError,
        presence, refresh, reconnect: () => socket?.connect(), canSend: connection === 'connected' && !loading && !!draft.trim() && submitted !== draft.trim() };
}
