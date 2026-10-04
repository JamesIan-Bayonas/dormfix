import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ruleCategories, type RuleFields } from '../../utils/rulesPresentation';
import { Button } from '../ui/Button';
import { FormField, Select, Textarea } from '../ui/FormField';
import { ErrorMessage } from '../ui/Feedback';

interface Props { rooms: { room_number: string }[]; roomsLoading: boolean; roomsError: string | null; onRetryRooms: () => void; onAdd: (fields: RuleFields) => Promise<boolean> }
export function RuleForm({ rooms, roomsLoading, roomsError, onRetryRooms, onAdd }: Props) {
    const [text, setText] = useState('');
    const [scope, setScope] = useState('Global');
    const [category, setCategory] = useState('General');
    const [priority, setPriority] = useState(false);
    const [busy, setBusy] = useState(false);
    const pending = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState('');
    const outcome = useRef<HTMLDivElement>(null);
    const checkboxId = useId();
    const scopeAvailable = scope === 'Global' || (!roomsLoading && !roomsError && rooms.some(room => room.room_number === scope));
    useEffect(() => { if (error || notice) outcome.current?.focus(); }, [error, notice]);
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (pending.current || !text.trim() || !scopeAvailable) return;
        pending.current = true; setBusy(true); setError(null); setNotice('');
        try {
            if (!await onAdd({ ruleText: text, roomNumber: scope, category, isPriority: priority })) throw new Error('The rule could not be confirmed.');
            setText(''); setScope('Global'); setCategory('General'); setPriority(false);
            setNotice('Rule published. Check the published list below for its current details.');
        } catch (failure) { setError(`${failure instanceof Error ? failure.message : 'The rule could not be confirmed.'} Your entries are retained. Check the published list before retrying.`); }
        finally { pending.current = false; setBusy(false); }
    }
    return <form className="space-y-5" onSubmit={submit} aria-busy={busy || undefined}>
        <h2 className="df-section-title">Publish a rule</h2>
        <p className="text-sm text-muted">State what tenants should do and choose where the rule applies.</p>
        <FormField label="Applies to" hint={roomsLoading ? 'Loading room choices. All rooms is still available.' : 'All rooms includes every tenant in the dormitory.'}>{field => <Select {...field} value={scope} disabled={busy} onChange={event => setScope(event.target.value)}>
            <option value="Global">All rooms</option>{scope !== 'Global' && !rooms.some(room => room.room_number === scope) && <option value={scope} disabled>Room {scope} — unavailable</option>}
            <optgroup label="Specific rooms" disabled={roomsLoading || !!roomsError}>{rooms.map(room => <option key={room.room_number} value={room.room_number}>Room {room.room_number}</option>)}</optgroup>
        </Select>}</FormField>
        {roomsError && <ErrorMessage>{roomsError} <Button variant="quiet" disabled={busy} onClick={onRetryRooms}>Retry rooms</Button></ErrorMessage>}
        {!scopeAvailable && <p className="text-sm text-warning">The selected room cannot be confirmed. Refresh rooms or choose All rooms.</p>}
        <FormField label="Category">{field => <Select {...field} value={category} disabled={busy} onChange={event => setCategory(event.target.value)}>{ruleCategories.map(value => <option key={value}>{value}</option>)}</Select>}</FormField>
        <div className="space-y-2"><label htmlFor={checkboxId} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold"><input id={checkboxId} type="checkbox" className="h-5 w-5 shrink-0 accent-primary" aria-describedby={`${checkboxId}-hint`} checked={priority} disabled={busy} onChange={event => setPriority(event.target.checked)} />Mark as priority</label><p id={`${checkboxId}-hint`} className="text-sm text-muted">Priority rules appear first and carry a visible label.</p></div>
        <FormField label="Rule text" hint="Use clear, specific instructions. Line breaks are preserved.">{field => <Textarea {...field} required rows={5} value={text} disabled={busy} onChange={event => { setText(event.target.value); setNotice(''); }} />}</FormField>
        <div ref={outcome} tabIndex={-1}>{error && <ErrorMessage>{error}</ErrorMessage>}<p role="status" className="text-sm text-success">{notice}</p></div>
        <Button type="submit" className="w-full" loading={busy} loadingText="Publishing…" disabled={!text.trim() || !scopeAvailable}>Publish rule</Button>
    </form>;
}
