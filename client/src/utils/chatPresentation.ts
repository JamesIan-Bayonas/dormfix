export type ChatRole = 'landlord' | 'tenant';
export interface ChatMessage {
    id: string;
    senderId: string;
    senderRole: ChatRole;
    text: string;
    timestamp: string | null;
    recorded: boolean;
}
export interface ConversationScope { roomId: string; userId: string; peerId: string; role: ChatRole }

export function chatMessage(value: unknown, scope: ConversationScope, recorded: boolean): ChatMessage | null {
    if (!value || typeof value !== 'object') return null;
    const data = value as Record<string, unknown>;
    const role = recorded ? data.senderRole : data.role;
    if (data.roomId !== undefined && data.roomId !== scope.roomId) return null;
    if (typeof data.text !== 'string' || typeof data.senderId !== 'string' ||
        (typeof data.id !== 'string' && typeof data.id !== 'number')) return null;
    const own = data.senderId === scope.userId && role === scope.role;
    const peer = data.senderId === scope.peerId && role === (scope.role === 'landlord' ? 'tenant' : 'landlord');
    if (!own && !peer) return null;
    // Shared landlord sockets may still belong to earlier rooms. An own echo without
    // a room ID cannot be attributed safely; the caller reads the selected history.
    if (!recorded && scope.role === 'landlord' && own && data.roomId === undefined) return null;
    const date = typeof data.timestamp === 'string' ? new Date(data.timestamp) : null;
    return { id: String(data.id), senderId: data.senderId, senderRole: role as ChatRole,
        text: data.text, timestamp: date && Number.isFinite(date.getTime()) ? date.toISOString() : null, recorded };
}

export function mergeChatMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
    const messages = new Map(current.map(message => [message.id, message]));
    for (const message of incoming) {
        const previous = messages.get(message.id);
        // History is evidence of persistence. A subsequent echo must not undo it.
        messages.set(message.id, previous?.recorded && !message.recorded ? previous : message);
    }
    return [...messages.values()].sort((a, b) => a.timestamp && b.timestamp ? a.timestamp.localeCompare(b.timestamp) : 0);
}

export function chatBody(scope: ConversationScope, text: string, tempId: number) {
    return scope.role === 'landlord'
        ? { roomId: scope.roomId, senderId: scope.userId, recipientId: scope.peerId, role: scope.role, text: text.trim() }
        : { roomId: scope.roomId, senderId: scope.userId, role: scope.role, text: text.trim(), tempId };
}

export function presenceLabel(online: boolean | null, lastSeen: string | null): string {
    if (online === true) return 'Online';
    const date = lastSeen ? new Date(lastSeen) : null;
    if (date && Number.isFinite(date.getTime())) return `Last seen ${date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`;
    return online === false ? 'Offline · last seen unavailable' : 'Presence unavailable';
}
