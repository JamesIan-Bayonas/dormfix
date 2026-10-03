import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, Wrench, MessageSquare, ShieldCheck } from 'lucide-react';
import type { User } from '../../types/types';
import { Button } from '../ui/Button';
import { PageHeader, Panel } from '../ui/Layout';
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
    children?: ReactNode;
}
const taskClass = 'flex min-h-16 w-full items-center gap-3 rounded-control p-4 text-left hover:bg-surface-muted';

export function TenantHome({ user, housing, loading, error, onRetry, onRules, onEditProfile, children }: Props) {
    const housingReady = !loading && !error && !!housing?.landlordId;
    const assigned = housingReady && !!housing?.roomNumber && housing.roomNumber !== 'Unassigned';
    const unavailable = loading ? 'Loading your housing details…' : error || !housing ? 'Housing details are unavailable. Retry housing details.' : 'Your landlord must assign a room first.';
    const detailsDate = housing?.moveInDate ? new Date(housing.moveInDate) : null;
    return <div className="space-y-6">
        <PageHeader title="Home" description={`Welcome, ${user.name}. Manage your dormitory tasks here.`} />
        {loading ? <LoadingState>Loading your housing details…</LoadingState> : error ? <ErrorState title="Housing details unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Try again</Button>} /> : housing &&
            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-control border border-divider bg-surface p-4 text-sm">
                <p><span className="font-semibold">Room: </span>{assigned ? housing.roomNumber : 'Not yet assigned'}</p>
                <p className="min-w-0 break-words"><span className="font-semibold">Landlord: </span>{housing.landlordName}</p>
            </div>}
        <section aria-labelledby="tenant-tasks-title" className="space-y-3">
            <h2 id="tenant-tasks-title" className="df-section-title">Your tasks</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                <Panel className="p-0 sm:p-0">
                    {assigned ? <Link to="/pay" className={taskClass}><CreditCard size={22} aria-hidden="true" className="shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block font-semibold">Submit payment proof</span><span className="block text-sm text-muted">Upload a receipt for landlord review</span></span><ArrowRight size={18} aria-hidden="true" className="shrink-0" /></Link> :
                        <div className="space-y-1 p-4"><button type="button" disabled aria-describedby="payment-unavailable" className="flex min-h-11 items-center gap-3 text-muted"><CreditCard size={22} aria-hidden="true" />Submit payment proof</button><p id="payment-unavailable" className="text-sm text-muted">{unavailable}</p></div>}
                    <div className="border-t border-divider px-4 py-2">{assigned ? <Link to="/history" className="df-button df-button--quiet">Payment history<ArrowRight size={16} aria-hidden="true" /></Link> : <p className="py-3 text-sm text-muted">Payment history becomes available after room assignment.</p>}</div>
                </Panel>
                <Panel className="p-0 sm:p-0">{assigned ? <Link to="/report" className={taskClass}><Wrench size={22} aria-hidden="true" className="shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block font-semibold">Report an issue</span><span className="block text-sm text-muted">Request maintenance for your room</span></span><ArrowRight size={18} aria-hidden="true" className="shrink-0" /></Link> :
                    <div className="space-y-1 p-4"><button type="button" disabled aria-describedby="repair-unavailable" className="flex min-h-11 items-center gap-3 text-muted"><Wrench size={22} aria-hidden="true" />Report an issue</button><p id="repair-unavailable" className="text-sm text-muted">{unavailable}</p></div>}</Panel>
                <Panel className="p-0 sm:p-0">{housingReady ? <Link to="/chat" className={taskClass}><MessageSquare size={22} aria-hidden="true" className="shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block font-semibold">Message landlord</span><span className="block text-sm text-muted">Open your conversation</span></span><ArrowRight size={18} aria-hidden="true" className="shrink-0" /></Link> :
                    <div className="space-y-1 p-4"><button type="button" disabled className="min-h-11 text-muted" aria-describedby="messages-unavailable">Message landlord</button><p id="messages-unavailable" className="text-sm text-muted">{unavailable}</p></div>}</Panel>
                <Panel className="p-0 sm:p-0"><button type="button" onClick={onRules} disabled={!housingReady} aria-describedby={!housingReady ? 'rules-unavailable' : undefined} className={`${taskClass} disabled:cursor-not-allowed disabled:text-muted`}><ShieldCheck size={22} aria-hidden="true" className="shrink-0" /><span className="min-w-0 flex-1"><span className="block font-semibold">House rules</span><span className="block text-sm text-muted">Read dormitory and room policies</span></span><ArrowRight size={18} aria-hidden="true" className="shrink-0" /></button>{!housingReady && <p id="rules-unavailable" className="px-4 pb-4 text-sm text-muted">{unavailable}</p>}</Panel>
            </div>
        </section>
        {children}
        <details className="df-panel">
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
