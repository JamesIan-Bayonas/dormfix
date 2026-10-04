import { StrictMode, useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Link, useLocation } from 'react-router-dom';
import '../../src/index.css';
import { Conversation } from '../../src/components/messages/Conversation';
import { Contacts, type ChatContact } from '../../src/components/messages/Contacts';
import { RoomOccupancy } from '../../src/components/landlord/RoomOccupancy';
import { WorkspaceShell } from '../../src/components/ui/WorkspaceShell';
import { Button } from '../../src/components/ui/Button';
import { PageHeader, Panel } from '../../src/components/ui/Layout';
import { EmptyState } from '../../src/components/ui/Feedback';
import type { MessagingSocket } from '../../src/hooks/useConversation';

type Listener = (payload: unknown) => void;
class FixtureSocket implements MessagingSocket {
    connected = true;
    listeners = new Map<string, Set<Listener>>();
    submitted: Record<string, unknown>[] = [];
    histories = new Map<string, Record<string, unknown>[]>();
    broadcastOnly = false;
    throwOnSend = false;
    notify = () => {};
    on(event: string, handler: Listener) { if (!this.listeners.has(event)) this.listeners.set(event, new Set()); this.listeners.get(event)?.add(handler); }
    off(event: string, handler: Listener) { this.listeners.get(event)?.delete(handler); }
    receive(event: string, payload: unknown = undefined) { for (const handler of this.listeners.get(event) || []) handler(payload); }
    connect() { this.connected = true; this.receive('connect'); }
    disconnect() { this.connected = false; this.receive('disconnect'); }
    emit(event: string, payload: unknown) {
        if (event === 'check_presence') { this.receive('presence_status', { userId: payload, isOnline: true }); return; }
        if (event === 'toggle_mute') { const data = payload as Record<string, unknown>; this.receive('chat_error', { message: data.status ? 'Communication capabilities restricted by property management.' : 'Communication capabilities restored.' }); return; }
        if (event !== 'send_message') return;
        if (this.throwOnSend) throw new Error('Simulated submission failure');
        const data = payload as Record<string, unknown>;
        this.submitted.push(data);
        this.notify();
        const message = { id: `sent-${this.submitted.length}`, senderId: data.senderId, role: data.role, text: data.text, timestamp: new Date().toISOString() };
        if (!this.broadcastOnly) {
            const history = this.histories.get(String(data.roomId)) || [];
            this.histories.set(String(data.roomId), [...history, { ...message, senderRole: data.role, roomId: data.roomId }]);
        }
        this.receive('receive_message', message);
    }
}
const contacts: ChatContact[] = [
    { id: 't1', name: 'Alex Rivera', room: '108', phone: '09000000001' },
    { id: 't2', name: 'Jamie Santos', room: '109', phone: '09000000002' },
    { id: 't3', name: 'A tenant with a long name that must remain readable', room: 'Unassigned' },
];
const readPresence = async () => null;
const user = { id: 'l', name: 'Property manager', email: 'fixture@example.test', role: 'landlord' as const, dormFixId: 'DEMO', phoneNumber: '' };

/* Real conversation hook/components, simulated transport. No auth, API, sockets or persistent writes. */
export default function MessagesFixture() {
    const { pathname } = useLocation();
    const tenant = pathname === '/tenant';
    const rooms = pathname === '/rooms';
    const [socket] = useState(() => {
        const transport = new FixtureSocket();
        for (const contact of contacts) transport.histories.set(`l-${contact.id}`, [{ id: `history-${contact.id}`, senderId: contact.id, senderRole: 'tenant', roomId: `l-${contact.id}`, text: `History for ${contact.name}.\nThe cupboard under the sink is damp. Please check the pipe when convenient.\nReference: ${'LONG-REFERENCE-'.repeat(16)}`, timestamp: '2026-10-03T01:00:00Z' }]);
        return transport;
    });
    const [selected, setSelected] = useState<ChatContact | null>(null);
    const [historyFail, setHistoryFail] = useState(false);
    const [slow, setSlow] = useState(false);
    const [contactMode, setContactMode] = useState('Populated');
    const [broadcastOnly, setBroadcastOnly] = useState(false);
    const [submissionFail, setSubmissionFail] = useState(false);
    const [emptyHistory, setEmptyHistory] = useState(false);
    const [, redraw] = useState(0);
    socket.notify = () => redraw(value => value + 1);
    const configuration = useRef({ historyFail, slow, emptyHistory });
    configuration.current = { historyFail, slow, emptyHistory };
    socket.broadcastOnly = broadcastOnly;
    socket.throwOnSend = submissionFail;
    const workspace = useRef<HTMLDivElement>(null);
    const loadHistory = useCallback(async (roomId: string) => {
        const configurationAtStart = configuration.current;
        const snapshot = configurationAtStart.emptyHistory ? [] : [...(socket.histories.get(roomId) || [])];
        // Intentionally ignores abort to exercise the hook's stale-read guard.
        await new Promise(resolve => setTimeout(resolve, configurationAtStart.slow ? 3000 : 500));
        if (configurationAtStart.historyFail) throw new Error('Simulated history failure');
        return snapshot;
    }, [socket]);
    const active = tenant ? contacts[0] : selected;
    const fixtureUser = tenant ? { ...user, id: 't1', name: 'Alex Rivera', role: 'tenant' as const } : user;
    function back() {
        const id = selected?.id; setSelected(null);
        requestAnimationFrame(() => [...(workspace.current?.querySelectorAll<HTMLButtonElement>('[data-contact-id]') || [])].find(element => element.dataset.contactId === id)?.focus());
    }
    return <WorkspaceShell role={tenant ? 'tenant' : 'landlord'} user={fixtureUser} onLogout={() => {}} onEditProfile={() => {}}>
        <div ref={workspace} className="space-y-6">
            <Panel className="space-y-3"><p className="text-sm font-semibold">Fictional review fixture · no real accounts or messages</p>
                <nav className="flex flex-wrap gap-2"><Link className="df-button df-button--secondary" to="/chat">Landlord preview</Link><Link className="df-button df-button--secondary" to="/tenant">Tenant preview</Link><Link className="df-button df-button--secondary" to="/rooms">Rooms preview</Link></nav>
                <details open><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Review controls</summary><div className="space-y-3">
                <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { socket.disconnect(); redraw(value => value + 1); }}>Simulate disconnect</Button><Button variant="secondary" onClick={() => { socket.connect(); redraw(value => value + 1); }}>Simulate reconnect</Button>
                    <Button variant="secondary" onClick={() => { socket.receive('receive_message', { id: `incoming-${Date.now()}`, senderId: tenant ? 'l' : active?.id || 't1', role: tenant ? 'landlord' : 'tenant', text: 'A live message during the history read.\nThis line remains visible.', timestamp: new Date().toISOString() }); }}>Simulate incoming</Button>
                    <Button variant="secondary" onClick={() => socket.receive('receive_message', { id: 'other-tenant', senderId: 'outside-conversation', role: 'tenant', text: 'THIS OTHER TENANT MESSAGE MUST NOT APPEAR', timestamp: new Date().toISOString() })}>Other tenant message</Button>
                    <Button variant="secondary" onClick={() => socket.receive('chat_error', { message: 'Communication capabilities restricted by property management.' })}>Simulate restriction notice</Button></div>
                <div className="flex flex-wrap gap-4">{[['History failure', historyFail, setHistoryFail], ['Slow history', slow, setSlow], ['Broadcast without saving', broadcastOnly, setBroadcastOnly], ['Submission failure', submissionFail, setSubmissionFail], ['Empty history', emptyHistory, setEmptyHistory]].map(([label, checked, change]) =>
                    <label key={String(label)} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={checked as boolean} onChange={event => (change as (value: boolean) => void)(event.target.checked)} />{String(label)}</label>)}
                    <label className="flex min-h-11 items-center gap-2 text-sm">Contacts<select className="df-control" value={contactMode} onChange={event => setContactMode(event.target.value)}>{['Populated', 'Loading', 'Error', 'Empty'].map(mode => <option key={mode}>{mode}</option>)}</select></label></div>
                <output className="block break-words text-sm text-muted" aria-label="Transport diagnostics">Send events: {socket.submitted.length} · Receive listeners: {socket.listeners.get('receive_message')?.size || 0}</output>
                </div></details>
            </Panel>
            <PageHeader title={rooms ? 'Rooms' : tenant ? 'Message landlord' : 'Messages'} description={tenant ? 'Contact your landlord about your dormitory.' : 'Choose an approved tenant to view your conversation.'} />
            {rooms ? <RoomOccupancy rooms={[{ id: 'r1', room_number: '108', capacity: 2, currentOccupants: 2 }, { id: 'r2', room_number: '109', capacity: 3, currentOccupants: 1 }, { id: 'r3', room_number: 'Very long room reference '.repeat(6), capacity: 1, currentOccupants: 0 }]} /> :
                <div className={tenant ? 'mx-auto max-w-3xl' : 'grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]'}>
                    {!tenant && <div className={active ? 'hidden min-w-0 lg:block' : 'min-w-0'}><Contacts contacts={contactMode === 'Empty' ? [] : contacts} loading={contactMode === 'Loading'} error={contactMode === 'Error' ? 'Contacts could not be loaded.' : null} selectedId={selected?.id} onSelect={setSelected} onRetry={() => setContactMode('Populated')} /></div>}
                    {active ? <Conversation key={`${tenant ? 'tenant' : 'landlord'}:${active.id}`} roomId={`l-${active.id}`} userId={tenant ? 't1' : 'l'} peerId={tenant ? 'l' : active.id} role={tenant ? 'tenant' : 'landlord'} name={tenant ? 'Morgan Reyes' : active.name} phone={active.phone} socket={socket} loadHistory={loadHistory} loadPresence={readPresence} onBack={tenant ? undefined : back} /> :
                        <Panel className="hidden lg:block"><EmptyState title="Choose a tenant" description="Select a tenant to read history or write a message." /></Panel>}
                </div>}
        </div>
    </WorkspaceShell>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><MessagesFixture /></HashRouter></StrictMode>);
