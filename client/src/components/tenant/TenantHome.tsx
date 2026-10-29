import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, CreditCard, Wrench, MessageSquare, ShieldCheck } from 'lucide-react';
import type { User } from '../../types/types';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/Layout';
import { ErrorState, LoadingState } from '../ui/Feedback';

export interface HousingSummary {
    landlordId: string;
    landlordName: string;
    landlordEmail: string;
    landlordPhone?: string | null;
    roomNumber: string;
    moveInDate: string;
}
interface Props {
    user: Pick<User, 'name' | 'email' | 'phoneNumber' | 'dormFixId'>;
    housing: HousingSummary | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onRules: () => void;
    onEditProfile: () => void;
    summary?: ReactNode;
    children?: ReactNode;
}

export function TenantHome({ user, housing, loading, error, onRetry, onRules, onEditProfile, summary, children }: Props) {
    const housingReady = !loading && !error && !!housing?.landlordId;
    const assigned = housingReady && !!housing?.roomNumber && housing.roomNumber !== 'Unassigned';
    const unavailable = loading ? 'Loading your housing details…' : error || !housing ? 'Housing details are unavailable. Retry housing details.' : 'Your landlord must assign a room first.';
    const detailsDate = housing?.moveInDate ? new Date(housing.moveInDate) : null;
    return <div className="space-y-6">
        <PageHeader title={`Welcome home, ${user.name}.`} description="Your room, payments, and requests in one place." />
        {loading ? <LoadingState>Loading your housing details…</LoadingState> : error ? <ErrorState title="Housing details unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Try again</Button>} /> : housing &&
            <div className="df-card flex flex-wrap items-center gap-3 text-sm">
                <div className="rounded-control bg-surface-muted p-3 text-primary"><BedDouble size={24} aria-hidden="true" /></div>
                <div className="min-w-0 flex-1 space-y-1"><h2 className="font-semibold">{assigned ? `Room ${housing.roomNumber}` : 'Room assignment pending'}</h2><p className="break-words text-muted">Landlord: {housing.landlordName}</p></div>
                <Link to="/chat" className="df-button df-button--secondary w-full sm:w-auto">Contact landlord<MessageSquare size={18} aria-hidden="true" /></Link>
            </div>}
        {summary}
        <section aria-labelledby="tenant-tasks-title" className="space-y-3">
            <h2 id="tenant-tasks-title" className="df-section-title">What would you like to do?</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {assigned ? <Link to="/pay" className="df-button df-button--primary justify-start text-left"><CreditCard size={20} aria-hidden="true" className="shrink-0" />Submit payment proof</Link> : <Button disabled aria-describedby="tenant-room-unavailable" className="justify-start text-left"><CreditCard size={20} aria-hidden="true" className="shrink-0" />Submit payment proof</Button>}
                {assigned ? <Link to="/report" className="df-button df-button--secondary justify-start text-left"><Wrench size={20} aria-hidden="true" className="shrink-0" />Report an issue</Link> : <Button variant="secondary" disabled aria-describedby="tenant-room-unavailable" className="justify-start text-left"><Wrench size={20} aria-hidden="true" className="shrink-0" />Report an issue</Button>}
                {housingReady ? <Link to="/chat" className="df-button df-button--secondary justify-start text-left"><MessageSquare size={20} aria-hidden="true" className="shrink-0" />Message landlord</Link> : <Button variant="secondary" disabled aria-describedby="tenant-room-unavailable" className="justify-start text-left"><MessageSquare size={20} aria-hidden="true" className="shrink-0" />Message landlord</Button>}
                <Button variant="secondary" onClick={onRules} disabled={!housingReady} aria-describedby={!housingReady ? 'tenant-room-unavailable' : undefined} className="justify-start text-left"><ShieldCheck size={20} aria-hidden="true" className="shrink-0" />House rules</Button>
            </div>
            {!assigned && <p id="tenant-room-unavailable" className="text-sm text-muted">{unavailable}</p>}
        </section>
        {children}
        <details className="df-card">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold">Account and housing details</summary>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div className="min-w-0 space-y-3"><h2 className="df-section-title">Your account</h2><dl className="space-y-3 text-sm">
                    <div><dt className="font-semibold">Email</dt><dd className="break-all text-muted">{user.email}</dd></div>
                    <div><dt className="font-semibold">Phone</dt><dd className="text-muted">{user.phoneNumber || 'Not provided'}</dd></div>
                    <div><dt className="font-semibold">DormFix ID</dt><dd className="break-all font-mono text-muted">{user.dormFixId}</dd></div>
                </dl><Button variant="secondary" onClick={onEditProfile}>Edit profile</Button></div>
                {housing && <div className="min-w-0 space-y-3"><h2 className="df-section-title">Your landlord</h2><dl className="space-y-3 text-sm">
                    <div><dt className="font-semibold">Name</dt><dd className="break-words text-muted">{housing.landlordName}</dd></div>
                    <div><dt className="font-semibold">Email</dt><dd><a href={`mailto:${housing.landlordEmail}`} className="inline-flex min-h-11 items-center break-all text-primary underline">{housing.landlordEmail}</a></dd></div>
                    {housing.landlordPhone && <div><dt className="font-semibold">Phone</dt><dd><a href={`tel:${housing.landlordPhone}`} className="inline-flex min-h-11 items-center text-primary underline">{housing.landlordPhone}</a></dd></div>}
                    {detailsDate && Number.isFinite(detailsDate.getTime()) && <div><dt className="font-semibold">Tenancy start</dt><dd className="text-muted">{detailsDate.toLocaleDateString()}</dd></div>}
                </dl></div>}
            </div>
        </details>
    </div>;
}
