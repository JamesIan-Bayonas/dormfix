import { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/Feedback';
import { FormField, Input } from '../ui/FormField';
import { Search, ChevronRight } from 'lucide-react';
import { ContactAvatar } from './MessagesLayout';

export interface ChatContact { id: string; name: string; phone?: string | null; room?: string | null }
interface Props { contacts: ChatContact[]; selectedId?: string; loading: boolean; error: string | null; onRetry: () => void; onSelect: (contact: ChatContact) => void }
export function Contacts({ contacts, selectedId, loading, error, onRetry, onSelect }: Props) {
    const [query, setQuery] = useState('');
    const search = useRef<HTMLInputElement>(null);
    const visible = contacts.filter(contact => [contact.name, contact.phone, contact.room].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
    return <section aria-label="Tenant conversations" className="min-w-0 space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Tenants</h2>{!loading && !error && <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted" aria-label={`${contacts.length} approved tenants`}>{contacts.length}</span>}</div>
        <FormField label="Find a tenant" hint="Search by name, room or phone.">{description => <Input {...description} ref={search} type="search" leadingIcon={<Search size={17} />} placeholder="Search tenants…" value={query} onChange={event => setQuery(event.target.value)} />}</FormField>
        {loading && <LoadingState>Loading contacts…</LoadingState>}
        {error && <ErrorMessage>{error}<div className="mt-3"><Button variant="secondary" onClick={() => { onRetry(); requestAnimationFrame(() => search.current?.focus()); }}>Retry contacts</Button></div></ErrorMessage>}
        {!loading && !error && !contacts.length ? <EmptyState title="No approved tenants yet" description="Conversations become available after tenant approval." /> : !loading && contacts.length > 0 && !visible.length ?
            <EmptyState title="No matching tenants" description="Try another name, room or phone number." action={<Button variant="secondary" onClick={() => { setQuery(''); search.current?.focus(); }}>Clear search</Button>} /> :
            <ul className="space-y-1 lg:max-h-[34rem] lg:overflow-y-auto lg:pr-1">{visible.map(contact => <li key={contact.id}><button type="button"
                data-contact-id={contact.id} aria-pressed={contact.id === selectedId} onClick={() => onSelect(contact)}
                className={`flex min-h-11 w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${contact.id === selectedId ? 'border-primary/40 bg-selected' : 'border-transparent hover:bg-surface-muted'}`}>
                <ContactAvatar name={contact.name} />
                <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{contact.name}</span>
                <span className="mt-1 block break-words text-xs text-muted">{contact.room && contact.room !== 'Unassigned' ? `Room ${contact.room}` : 'Room not assigned'}</span>
                {contact.phone && <span className="mt-1 block break-all text-xs text-muted">{contact.phone}</span>}
                {contact.id === selectedId && <span className="mt-1 block text-xs font-semibold text-primary">Selected conversation</span>}</span>
                <ChevronRight size={16} className="mt-3 shrink-0 text-muted" aria-hidden="true" />
            </button></li>)}</ul>}
    </section>;
}
