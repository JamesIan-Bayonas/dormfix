import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../UserContext';
import { Conversation } from '../messages/Conversation';
import { Contacts, type ChatContact } from '../messages/Contacts';
import { PageHeader, Panel } from '../ui/Layout';
import { EmptyState } from '../ui/Feedback';

export function LandlordChat() {
    const { user, globalSocket } = useAuth();
    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [selected, setSelected] = useState<ChatContact | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const workspace = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!user?.id) return;
        const controller = new AbortController();
        setLoading(true); setError(null);
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/landlord/tenants/${user.id}`, { signal: controller.signal })
            .then(async response => { if (!response.ok) throw new Error(); return response.json() as Promise<unknown>; })
            .then(data => {
                if (!Array.isArray(data)) throw new Error();
                const approved = data.flatMap((value: unknown): ChatContact[] => {
                    if (!value || typeof value !== 'object') return [];
                    const tenant = value as Record<string, unknown>;
                    if (!tenant.isApproved || typeof tenant.id !== 'string' || typeof tenant.name !== 'string') return [];
                    return [{ id: tenant.id, name: tenant.name, phone: typeof tenant.phoneNumber === 'string' ? tenant.phoneNumber : null,
                        room: typeof tenant.roomNumber === 'string' ? tenant.roomNumber : null }];
                });
                if (!controller.signal.aborted) {
                    setContacts(approved);
                    setSelected(previous => previous ? approved.find(contact => contact.id === previous.id) || null : null);
                }
            }).catch(() => { if (!controller.signal.aborted) setError('Tenant contacts could not be loaded. Please try again.'); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [user?.id, revision]);
    function back() {
        const id = selected?.id;
        setSelected(null);
        requestAnimationFrame(() => {
            const button = [...(workspace.current?.querySelectorAll<HTMLButtonElement>('[data-contact-id]') || [])].find(element => element.dataset.contactId === id);
            button?.focus();
        });
    }
    if (!user) return null;
    return <div className="space-y-6" ref={workspace}>
        <PageHeader title="Messages" description="Choose an approved tenant to view your conversation." />
        <div className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className={selected ? 'hidden min-w-0 lg:block' : 'min-w-0'}><Contacts contacts={contacts} selectedId={selected?.id} loading={loading} error={error} onRetry={() => setRevision(value => value + 1)} onSelect={setSelected} /></div>
            {selected ? <Conversation key={`${user.id}:${selected.id}`} roomId={`${user.id}-${selected.id}`} userId={user.id} peerId={selected.id} role="landlord" name={selected.name} phone={selected.phone} socket={globalSocket} onBack={back} /> :
                <Panel className="hidden lg:block"><EmptyState title="Choose a tenant" description="Select a tenant to read history or write a message." /></Panel>}
        </div>
    </div>;
}
