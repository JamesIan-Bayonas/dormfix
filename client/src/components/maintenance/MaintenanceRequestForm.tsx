import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { issueTypes, urgencyLevels, type MaintenanceFields } from '../../utils/maintenancePresentation';
import { Button } from '../ui/Button';
import { FormField, Select, Textarea } from '../ui/FormField';
import { ErrorMessage } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';

interface Props { onSubmit: (fields: MaintenanceFields) => Promise<unknown>; onDone: () => void; onSaved?: () => void; onBusyChange?: (busy: boolean) => void; unavailable?: boolean }
export function MaintenanceRequestForm({ onSubmit, onDone, onSaved, onBusyChange, unavailable }: Props) {
    const [issueType, setIssueType] = useState('Plumbing');
    const [urgency, setUrgency] = useState('Low');
    const [description, setDescription] = useState('');
    const [busy, setBusy] = useState(false);
    const pending = useRef(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const outcome = useRef<HTMLDivElement>(null);
    useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
    useEffect(() => { if (saved || error) outcome.current?.focus(); }, [saved, error]);
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (pending.current || unavailable || !description.trim()) return;
        pending.current = true; setBusy(true); setError(null);
        try { await onSubmit({ issueType, urgency, description }); setSaved(true); onSaved?.(); }
        catch (failure) { setError(failure instanceof Error ? failure.message : 'The report could not be confirmed.'); }
        finally { pending.current = false; setBusy(false); }
    }
    if (saved) return <div className="space-y-5">
        <div ref={outcome} tabIndex={-1} role="status" className="space-y-3 rounded-control border border-divider bg-surface-muted p-4"><h3 className="df-section-title">Issue reported</h3><StatusBadge tone="info">Awaiting review</StatusBadge><p className="text-sm">Your request has been recorded. Check Maintenance requests on home for updates.</p><p className="text-sm text-muted">Submission does not confirm a repair visit or that a notification has been read. The recorded urgency may differ after the server reviews the report.</p></div>
        <Button onClick={onDone}>Back to home</Button>
    </div>;
    return <form className="space-y-5" onSubmit={submit} aria-busy={busy || undefined}>
        <p className="text-sm text-muted">Describe where the problem is, what happened, and any details your landlord needs to assess it.</p>
        {unavailable && <ErrorMessage>A room must be assigned before you can report an issue. Return home and check your assignment.</ErrorMessage>}
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="Issue type">{field => <Select {...field} disabled={busy} value={issueType} onChange={event => setIssueType(event.target.value)}>{issueTypes.map(value => <option key={value}>{value}</option>)}</Select>}</FormField><FormField label="Urgency" hint="Choose the level that best describes the issue.">{field => <Select {...field} disabled={busy} value={urgency} onChange={event => setUrgency(event.target.value)}>{urgencyLevels.map(value => <option key={value}>{value}</option>)}</Select>}</FormField></div>
        <FormField label="Issue description" hint="Include the location and impact, for example a leaking tap preventing use of the sink.">{field => <Textarea {...field} data-autofocus required rows={6} disabled={busy} value={description} onChange={event => setDescription(event.target.value)} />}</FormField>
        {error && <div ref={outcome} tabIndex={-1}><ErrorMessage>{error} Your entries are retained. Check Maintenance requests on home before retrying in case the request was already recorded.</ErrorMessage></div>}
        {busy && <p role="status" className="text-sm text-info">Submitting the report and waiting for the server response…</p>}
        {!description.trim() && <p className="text-sm text-muted">Enter a description to submit.</p>}
        <Button type="submit" className="w-full" loading={busy} loadingText="Submitting report…" disabled={!description.trim() || unavailable}>Submit report</Button>
    </form>;
}
