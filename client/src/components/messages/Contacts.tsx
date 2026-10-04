import { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/Feedback';
import { FormField, Input } from '../ui/FormField';

export interface ChatContact { id: string; name: string; phone?: string | null; room?: string | null }
interface Props { contacts: ChatContact[]; selectedId?: string; loading: boolean; error: string | null; onRetry: () => void; onSelect: (contact: ChatContact) => void }
export function Contacts({ contacts, selectedId, loading, error, onRetry, onSelect }: Props) {
    const [query, setQuery] = useState('');
    const search = useRef<HTMLInputElement>(null);
    const visible = contacts.filter(contact => [contact.name, contact.phone, contact.room].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
    return <section aria-label="Tenant conversations" className="space-y-4 rounded-panel border border-divider bg-surface p-4 sm:p-6">
        <h2 className="df-section-title">Tenants</h2>
        <FormField label="Find a tenant" hint="Search by name, room or phone.">{description => <Input {...description} ref={search} type="search" value={query} onChange={event => setQuery(event.target.value)} />}</FormField>
        {loading && <LoadingState>Loading contacts…</LoadingState>}
        {error && <ErrorMessage>{error}<div className="mt-3"><Button variant="secondary" onClick={() => { onRetry(); requestAnimationFrame(() => search.current?.focus()); }}>Retry contacts</Button></div></ErrorMessage>}
        {!loading && !error && !contacts.length ? <EmptyState title="No approved tenants yet" description="Conversations become available after tenant approval." /> : !loading && contacts.length > 0 && !visible.length ?
            <EmptyState title="No matching tenants" description="Try another name, room or phone number." action={<Button variant="secondary" onClick={() => { setQuery(''); search.current?.focus(); }}>Clear search</Button>} /> :
            <ul className="space-y-2">{visible.map(contact => <li key={contact.id}><button type="button"
                data-contact-id={contact.id} aria-pressed={contact.id === selectedId} onClick={() => onSelect(contact)}
                className={`min-h-11 w-full rounded-control border p-3 text-left ${contact.id === selectedId ? 'border-primary bg-sage-100' : 'border-divider hover:bg-surface-muted'}`}>
                <span className="block break-words font-semibold">{contact.name}</span>
                <span className="mt-1 block break-words text-sm text-muted">{contact.room && contact.room !== 'Unassigned' ? `Room ${contact.room}` : 'Room not assigned'}{contact.phone ? ` · ${contact.phone}` : ''}</span>
                {contact.id === selectedId && <span className="mt-1 block text-sm font-semibold text-primary">Selected conversation</span>}
            </button></li>)}</ul>}
    </section>;
}
