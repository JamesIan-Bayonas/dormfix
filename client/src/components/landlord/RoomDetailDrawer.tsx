import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Eye } from 'lucide-react';
import type { LandlordMaintenanceRequest } from '../../types/types';
import { Drawer, Dialog, ConfirmationDialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { FormField, Select, Textarea } from '../ui/FormField';
import { ErrorMessage, EmptyState } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';
import { ImageLightbox, ReceiptPreview } from '../ui/ImageLightbox';

export interface RoomOccupant {
    id?: string;
    name: string;
    email?: string;
    phoneNumber?: string | null;
    joinedDate?: string;
    status: string;
    hasPendingPayment: boolean;
    paymentId?: string;
    paymentAmount?: number;
    paymentProof?: string;
}
export interface RoomDetailData {
    id: string;
    room_number: string;
    status: 'vacant' | 'occupied' | 'maintenance';
    currentOccupants: number;
    capacity: number;
    occupants: { id: string; name: string }[];
    occupantPaymentStatus: RoomOccupant[];
    activeIssues: LandlordMaintenanceRequest[];
    hasIssue: boolean;
    isCritical: boolean;
    paymentStatusAvailable?: boolean;
}
interface Props {
    isOpen: boolean;
    onClose: () => void;
    roomData: RoomDetailData | null;
    onVerifyPayment: (id: string, status: 'Verified' | 'Rejected', reason?: string) => Promise<boolean>;
    onResolveIssue: (id: string) => Promise<boolean>;
}

export const RoomDetailDrawer: React.FC<Props> = React.memo(({ isOpen, onClose, roomData, onVerifyPayment, onResolveIssue }) => {
    const [reviewId, setReviewId] = useState<string | null>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [resolveId, setResolveId] = useState<string | null>(null);
    const [reason, setReason] = useState('Screenshot is blurry / unreadable');
    const [customReason, setCustomReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const pending = useRef(false);

    async function run(operation: () => Promise<boolean>, afterSuccess: () => void) {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setError(null);
        try {
            if (await operation()) afterSuccess();
            else setError('The change could not be saved. Please try again.');
        } catch {
            setError('The change could not be saved. Please check your connection and try again.');
        } finally {
            pending.current = false;
            setBusy(false);
        }
    }
    if (!roomData) return null;

    return (
        <>
            <Drawer open={isOpen} onClose={onClose} title={`Room ${roomData.room_number}`} busy={busy}
                description={`${roomData.status} · ${roomData.currentOccupants} of ${roomData.capacity} places occupied`}>
                {error && !rejectId && !resolveId && <ErrorMessage>{error}</ErrorMessage>}
                {roomData.paymentStatusAvailable === false && <div className="space-y-3 rounded-control border border-divider p-4">
                    <p className="text-sm text-muted">Review receipts in Payments. Payment records cannot be reliably linked to an individual tenant from this room view.</p>
                    <Link to="/payments" onClick={onClose} className="df-button df-button--secondary">Open payments</Link>
                </div>}
                <section className="space-y-4" aria-label="Occupants">
                    <h3 className="df-section-title">Occupants</h3>
                    {roomData.occupants.length === 0 && <EmptyState title="This room is vacant" description="No tenants are assigned to this room." />}
                    {roomData.occupantPaymentStatus.map((occupant, index) => (
                        <div key={occupant.id || index} className="df-panel space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-ink">{occupant.name}</h4>
                                {occupant.joinedDate && <p className="text-sm text-muted">Joined {new Date(occupant.joinedDate).toLocaleDateString()}</p>}
                                {roomData.paymentStatusAvailable !== false && <StatusBadge tone={occupant.hasPendingPayment ? 'warning' : 'neutral'}>{occupant.status}</StatusBadge>}
                                {occupant.phoneNumber && <div className="flex flex-wrap gap-3">
                                    <a href={`tel:${occupant.phoneNumber}`} className="df-button df-button--secondary" aria-label={`Call ${occupant.name}`}><Phone size={16} aria-hidden="true" />Call</a>
                                    <a href={`sms:${occupant.phoneNumber}`} className="df-button df-button--secondary" aria-label={`Text ${occupant.name}`}><MessageCircle size={16} aria-hidden="true" />Text</a>
                                </div>}
                            </div>
                            {occupant.hasPendingPayment && occupant.paymentId ? (
                                <div className="space-y-3 border-t border-divider pt-4">
                                    <p className="text-sm font-semibold">Pending payment: ₱{occupant.paymentAmount}</p>
                                    {reviewId === occupant.paymentId ? <>
                                        {occupant.paymentProof && <ReceiptPreview key={occupant.paymentProof} src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${occupant.paymentProof}`} />}
                                        {occupant.paymentProof ? <Button variant="secondary" disabled={busy} onClick={() => setImage(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${occupant.paymentProof}`)}><Eye size={18} aria-hidden="true" />View full receipt</Button> : <p className="text-sm text-muted">No receipt image available.</p>}
                                        <div className="flex flex-wrap gap-3">
                                            <Button variant="secondary" disabled={busy} onClick={() => { setRejectId(occupant.paymentId!); setReason('Screenshot is blurry / unreadable'); setCustomReason(''); setError(null); }}>Reject</Button>
                                            <Button loading={busy} loadingText="Saving…" onClick={() => run(() => onVerifyPayment(occupant.paymentId!, 'Verified'), () => setReviewId(null))}>Verify payment</Button>
                                            <Button variant="quiet" disabled={busy} onClick={() => setReviewId(null)}>Cancel review</Button>
                                        </div>
                                    </> : <Button variant="secondary" disabled={busy} onClick={() => setReviewId(occupant.paymentId!)}>Review receipt</Button>}
                                </div>
                            ) : roomData.paymentStatusAvailable !== false ? <p className="text-sm text-muted">No pending payments.</p> : null}
                        </div>
                    ))}
                </section>
                <section className="space-y-4" aria-label="Active maintenance requests">
                    <h3 className="df-section-title">Active maintenance requests</h3>
                    {roomData.activeIssues.length === 0 && <p className="text-sm text-muted">No active requests for this room.</p>}
                    {roomData.activeIssues.map((issue) => <div key={issue.id} className="df-panel space-y-3">
                        <h4 className="font-semibold">{issue.issueType}</h4>
                        <StatusBadge tone={issue.urgency === 'High' || issue.urgency === 'Emergency' ? 'error' : 'neutral'}>{issue.urgency}</StatusBadge>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{issue.description}</p>
                        <Button variant="secondary" disabled={busy} onClick={() => { setResolveId(issue.id); setError(null); }}>Mark completed</Button>
                    </div>)}
                </section>
            </Drawer>
            <Dialog open={!!rejectId && isOpen} onClose={() => setRejectId(null)} title="Reject payment" busy={busy}>
                <form className="space-y-4" onSubmit={(event) => {
                    event.preventDefault();
                    if (rejectId) run(() => onVerifyPayment(rejectId, 'Rejected', reason === 'Other' ? customReason : reason), () => { setRejectId(null); setReviewId(null); });
                }}>
                    <FormField id="drawer-rejection-reason" label="Rejection reason">
                        {(field) => <Select {...field} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)}>
                            {['Screenshot is blurry / unreadable', 'Payment not received in account', 'Incorrect amount / reference', 'Other'].map((value) => <option key={value}>{value}</option>)}
                        </Select>}
                    </FormField>
                    {reason === 'Other' && <FormField id="drawer-custom-reason" label="Explain the reason">
                        {(field) => <Textarea {...field} required value={customReason} disabled={busy} onChange={(event) => setCustomReason(event.target.value)} />}
                    </FormField>}
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={busy} onClick={() => setRejectId(null)}>Cancel</Button><Button type="submit" variant="danger" loading={busy} loadingText="Saving…">Reject payment</Button></div>
                </form>
            </Dialog>
            <ConfirmationDialog open={!!resolveId && isOpen} onClose={() => setResolveId(null)} title="Complete maintenance request?" confirmLabel="Mark completed" destructive={false} busy={busy} error={error}
                onConfirm={() => { if (resolveId) run(() => onResolveIssue(resolveId), () => setResolveId(null)); }}>
                The request will be marked Completed in the tenant's maintenance history.
            </ConfirmationDialog>
            <ImageLightbox src={isOpen ? image : null} onClose={() => setImage(null)} />
        </>
    );
});
