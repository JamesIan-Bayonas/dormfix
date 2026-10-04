import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { localPaymentDate, type ProofFields } from '../../utils/paymentSubmission';
import { submissionResult } from '../../utils/paymentPresentation';
import { FormField, Input, Select, Textarea } from '../ui/FormField';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/Feedback';
import { ReceiptPreview } from '../ui/ImageLightbox';
import { StatusBadge } from '../ui/StatusBadge';

interface Props {
    onSubmit: (fields: ProofFields) => Promise<unknown>;
    onDone?: () => void;
    onBusyChange?: (busy: boolean) => void;
    unavailable?: boolean;
}

export function PaymentProofForm({ onSubmit, onDone, onBusyChange, unavailable }: Props) {
    const [amount, setAmount] = useState('');
    const [paymentType, setPaymentType] = useState('Rent');
    const [datePaid, setDatePaid] = useState(localPaymentDate);
    const [remarks, setRemarks] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const pending = useRef(false);
    const outcomeRef = useRef<HTMLDivElement>(null);
    const [saved, setSaved] = useState<ReturnType<typeof submissionResult> | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
    useEffect(() => {
        if (!file) { setPreview(null); return; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    useEffect(() => { if (saved || error) outcomeRef.current?.focus(); }, [saved, error]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (pending.current || !file || !amount || unavailable) return;
        pending.current = true; setBusy(true); setError(null);
        try { setSaved(submissionResult(await onSubmit({ amount, paymentType, datePaid, remarks, proof: file }))); }
        catch (failure) { setError(failure instanceof Error ? failure.message : 'The submission could not be confirmed.'); }
        finally { pending.current = false; setBusy(false); }
    }

    if (saved) return <div className="space-y-5">
        <div ref={outcomeRef} tabIndex={-1} role="status" className="space-y-3 rounded-control border border-divider bg-surface-muted p-4">
            <h3 className="df-section-title">Payment proof submitted</h3>
            <p className="text-sm">Your receipt has been recorded. Check payment history for the landlord’s verdict.</p>
            <StatusBadge tone={saved.scanStatus === 'Anomalous' ? 'warning' : 'info'}>{saved.scanStatus === 'Anomalous' ? 'Needs landlord review — scan warnings' : saved.scanStatus === 'Verified' ? 'Awaiting landlord review' : 'Recorded — check history'}</StatusBadge>
            <p className="text-sm text-muted">{saved.scanStatus === 'Verified' ? 'The receipt scan completed. It does not verify the payment on your landlord’s behalf.' : saved.scanStatus === 'Anomalous' ? 'The scan found warnings. The receipt is already saved; you do not need to upload it again for review.' : 'The scan result is unavailable or unexpected. Check history before submitting another receipt.'}</p>
            {saved.warnings.length > 0 && <ul className="list-disc space-y-2 pl-5 text-sm text-warning">{saved.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
        </div>
        <div className="flex flex-wrap gap-3"><Link className="df-button df-button--primary" to="/history">View payment history</Link>{onDone && <Button variant="secondary" onClick={onDone}>Done</Button>}</div>
        <p className="text-sm text-muted">Submitting another receipt creates a separate record.</p>
        <Button variant="quiet" onClick={() => { setSaved(null); setAmount(''); setRemarks(''); setFile(null); }}>Submit another receipt</Button>
    </div>;

    return <form className="space-y-5" onSubmit={submit} aria-busy={busy || undefined}>
        <p className="text-sm text-muted">Attach your receipt and enter the payment details. Your landlord reviews each submission.</p>
        {unavailable && <ErrorMessage>Your tenant or landlord details are unavailable. Return home and refresh before submitting.</ErrorMessage>}
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Amount (₱)">{field => <Input {...field} type="number" step="0.01" required inputMode="decimal" placeholder="0.00" value={amount} disabled={busy} onChange={event => setAmount(event.target.value)} />}</FormField>
            <FormField label="Date paid" hint="History currently records the submission date. The selected payment date is not retained.">{field => <Input {...field} type="date" required value={datePaid} disabled={busy} onChange={event => setDatePaid(event.target.value)} />}</FormField>
        </div>
        <FormField label="Payment type">{field => <Select {...field} value={paymentType} disabled={busy} onChange={event => setPaymentType(event.target.value)}>
            <option value="Rent">Rent</option><option value="Water">Water</option><option value="Electric">Electricity</option><option value="Maintenance">Maintenance</option><option value="Deposit">Deposit</option>
        </Select>}</FormField>
        <FormField label="Receipt image" hint="Choose a clear image of the full receipt. You can check the attachment below.">{field => <input {...field} type="file" accept="image/*" required disabled={busy} className="df-control file:mr-3 file:rounded-control file:border-0 file:bg-surface-muted file:px-3 file:py-1 file:font-medium" onChange={event => { setFile(event.target.files?.[0] || null); setError(null); }} />}</FormField>
        {file && <div className="space-y-3 rounded-control border border-divider p-4"><p className="break-all text-sm font-semibold">{file.name} <span className="font-normal text-muted">({Math.ceil(file.size / 1024)} KB)</span></p>{preview && <ReceiptPreview key={preview} src={preview} alt="Selected receipt image preview" />}</div>}
        <FormField label="Notes" optional hint="Add context or a transaction reference your landlord should check.">{field => <Textarea {...field} rows={3} value={remarks} disabled={busy} onChange={event => setRemarks(event.target.value)} />}</FormField>
        {error && <div ref={outcomeRef} tabIndex={-1}><ErrorMessage>{error} Check payment history before retrying: a lost response may occur after the receipt was saved. Your entries and attachment are retained.</ErrorMessage><Link to="/history" className="df-button df-button--quiet mt-2">Check payment history</Link></div>}
        {busy && <p role="status" className="text-sm text-info">Submitting your receipt and waiting for the server response. This may take a moment.</p>}
        {!busy && (!amount || !file) && <p className="text-sm text-muted">Enter an amount and attach a receipt to submit.</p>}
        <Button type="submit" className="w-full" loading={busy} loadingText="Submitting proof…" disabled={!amount || !file || unavailable}>Submit payment proof</Button>
    </form>;
}
