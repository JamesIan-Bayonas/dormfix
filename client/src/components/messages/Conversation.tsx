import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useConversation, type HistoryLoader, type MessagingSocket, type PresenceLoader } from '../../hooks/useConversation';
import { presenceLabel, type ConversationScope } from '../../utils/chatPresentation';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/Feedback';
import { FormField, Textarea } from '../ui/FormField';
import { StatusBadge } from '../ui/StatusBadge';

interface Props extends ConversationScope {
    name: string; phone?: string | null; socket: MessagingSocket | null;
    onBack?: () => void; loadHistory?: HistoryLoader; loadPresence?: PresenceLoader;
}
export function Conversation({ name, phone, onBack, ...options }: Props) {
    const chat = useConversation(options);
    const scroll = useRef<HTMLDivElement>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const composer = useRef<HTMLTextAreaElement>(null);
    const historyButton = useRef<HTMLButtonElement>(null);
    const submittedNotice = useRef<HTMLDivElement>(null);
    const atBottom = useRef(true);
    const [newMessages, setNewMessages] = useState(false);
    const [moderation, setModeration] = useState<boolean | null>(null);
    const [moderationError, setModerationError] = useState<string | null>(null);
    useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
    useEffect(() => { if (chat.submitted) submittedNotice.current?.focus({ preventScroll: true }); }, [chat.submitted]);
    useEffect(() => {
        if (!scroll.current) return;
        if (atBottom.current) scroll.current.scrollTop = scroll.current.scrollHeight;
        else setNewMessages(true);
    }, [chat.messages]);
    function showLatest() {
        if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
        scroll.current?.focus({ preventScroll: true });
        atBottom.current = true; setNewMessages(false);
    }
    function sendNotice() {
        if (!options.socket?.connected) { setModerationError('You are disconnected. Reconnect before sending the notice.'); return; }
        try {
            options.socket.emit('toggle_mute', { roomId: options.roomId, role: 'landlord', status: moderation });
            setModeration(null); setModerationError(null);
        } catch { setModerationError('The notice could not be submitted. Please try again.'); }
    }
    return <section aria-label={`Conversation with ${name}`} className="min-w-0 overflow-hidden rounded-panel border border-divider bg-surface">
        <header className="space-y-3 border-b border-divider p-4 sm:p-6">
            {onBack && <Button variant="quiet" onClick={onBack} className="lg:hidden"><ArrowLeft size={18} aria-hidden="true" />All tenants</Button>}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1"><h2 ref={heading} tabIndex={-1} className="df-section-title break-words">{name}</h2>
                    <p className="mt-1 text-sm text-muted">{presenceLabel(chat.presence.online, chat.presence.lastSeen)}</p>
                    {phone && <p className="mt-1 break-words text-sm text-muted">{phone}</p>}</div>
                <div className="flex flex-wrap gap-2">{phone && <>
                    <a href={`tel:${phone}`} className="df-button df-button--secondary" aria-label={`Call ${name}`}>Call</a>
                    <a href={`sms:${phone}`} className="df-button df-button--secondary" aria-label={`Text ${name} by SMS`}>SMS</a>
                </>}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3" role="status">
                <StatusBadge tone={chat.connection === 'connected' ? 'success' : 'warning'}>{chat.connection === 'connected' ? 'Connected' : chat.connection === 'connecting' ? 'Connecting…' : 'Disconnected'}</StatusBadge>
                {chat.connection !== 'connected' && <Button variant="secondary" onClick={() => { chat.reconnect(); heading.current?.focus({ preventScroll: true }); }}>Reconnect</Button>}
            </div>
            {chat.connection !== 'connected' && <p className="text-sm text-muted">Sending is unavailable. You can keep writing; your draft stays while this page is open. Reloading clears drafts.</p>}
        </header>
        {chat.notice && <div className="p-4 pb-0 sm:px-6"><ErrorMessage><p className="font-semibold">Messaging notice</p><p className="mt-1 break-words">{chat.notice}</p>
            <p className="mt-2">This notice does not confirm that messaging is blocked.{options.role === 'landlord' && ' The notice does not identify which conversation it concerns.'}</p></ErrorMessage></div>}
        <div className="px-4 pt-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-ink">Messages</h3><Button ref={historyButton} variant="quiet" loading={chat.loading} loadingText="Loading history…" onClick={() => void chat.refresh().then(() => requestAnimationFrame(() => historyButton.current?.focus({ preventScroll: true })))}>Refresh history</Button></div>
            {chat.historyError && <ErrorMessage>{chat.historyError}<div className="mt-3"><Button variant="secondary" onClick={() => void chat.refresh().then(() => requestAnimationFrame(() => historyButton.current?.focus({ preventScroll: true })))}>Retry history</Button></div></ErrorMessage>}
        </div>
        <div ref={scroll} tabIndex={0} role="log" aria-label="Conversation messages" aria-live="off" onScroll={() => {
            const element = scroll.current;
            if (element) { atBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 60; if (atBottom.current) setNewMessages(false); }
        }} className="max-h-[min(50dvh,32rem)] min-h-40 overflow-y-auto bg-surface-muted p-4 sm:p-6">
            {chat.loading && !chat.messages.length ? <LoadingState>Loading message history…</LoadingState> : !chat.messages.length && !chat.historyError ?
                <EmptyState title="No messages yet" description="Write a message below to start this conversation." /> :
                <ol className="space-y-5">{chat.messages.map(message => {
                    const own = message.senderId === options.userId;
                    return <li key={message.id} className={`flex flex-col gap-1 ${own ? 'items-end' : 'items-start'}`}>
                        <div className="max-w-full break-words text-sm text-muted"><span className="font-semibold">{own ? 'You' : name}</span>{' · '}{message.timestamp ? <time dateTime={message.timestamp}>{new Date(message.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</time> : 'Time unavailable'}</div>
                        <p className={`max-w-[92%] whitespace-pre-wrap rounded-control px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere] sm:max-w-[85%] ${own ? 'bg-primary text-white' : 'border border-divider bg-surface text-ink'}`}>{message.text}</p>
                        {!message.recorded && <span className="text-sm text-muted">Live message · saving unconfirmed</span>}
                    </li>;
                })}</ol>}
        </div>
        <div className="sr-only" role="status">{chat.messages.length ? `${chat.messages.length} messages shown.` : ''}</div>
        {newMessages && <div className="px-4 pt-3 sm:px-6"><Button variant="secondary" onClick={showLatest}>Show latest messages</Button></div>}
        <form onSubmit={event => { event.preventDefault(); chat.send(); }} className="space-y-3 border-t border-divider p-4 sm:p-6">
            {chat.sendError && <ErrorMessage>{chat.sendError}</ErrorMessage>}
            {chat.submitted && <div ref={submittedNotice} tabIndex={-1} role="status" className="rounded-control border border-info/30 bg-info-soft p-3 text-sm text-ink">{chat.submitted === chat.draft.trim()
                ? 'Message submitted to the connection. Saving and delivery are unconfirmed. Your draft is kept; refresh history before resending.'
                : 'Your earlier message was submitted; saving and delivery are unconfirmed. The text below has changed and has not been submitted.'}</div>}
            <FormField label="Message" hint="Enter adds a new line. Use Send message to submit. Drafts stay while this page is open; reloading clears them.">{description =>
                <Textarea {...description} ref={composer} rows={3} value={chat.draft} onChange={event => chat.setDraft(event.target.value)} />}</FormField>
            <div className="flex flex-wrap gap-2"><Button type="submit" disabled={!chat.canSend}><Send size={18} aria-hidden="true" />Send message</Button>
                {chat.submitted === chat.draft.trim() && <Button variant="secondary" onClick={() => { chat.newDraft(); composer.current?.focus(); }}>Write another message</Button>}</div>
        </form>
        {options.role === 'landlord' && <details className="border-t border-divider px-4 py-3 sm:px-6"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Communication notices</summary>
            <p className="my-3 text-sm leading-relaxed text-muted">Send a restriction or restoration notice to this conversation. Notices do not enforce a messaging block.</p>
            <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={chat.connection !== 'connected'} onClick={() => { setModeration(true); setModerationError(null); }}>Restriction notice</Button><Button variant="secondary" disabled={chat.connection !== 'connected'} onClick={() => { setModeration(false); setModerationError(null); }}>Restoration notice</Button></div>
        </details>}
        <Dialog open={moderation !== null} onClose={() => setModeration(null)} title={moderation ? 'Send restriction notice?' : 'Send restoration notice?'}>
            <div className="space-y-4"><p className="text-sm leading-relaxed">Send this notice to {name}? It communicates your request, but does not block or restore sending permissions.</p>
                {moderationError && <ErrorMessage>{moderationError}</ErrorMessage>}
                <div className="flex flex-wrap gap-2"><Button data-autofocus variant="secondary" onClick={() => setModeration(null)}>Cancel</Button><Button onClick={sendNotice}>Send notice</Button></div></div>
        </Dialog>
    </section>;
}
