import { sessionFetch } from '../../api/session';
import { Dialog } from '../ui/Dialog';
import { ErrorMessage } from '../ui/Feedback';
import { WorkspaceShell } from '../ui/WorkspaceShell';
import { TenantHome } from '../tenant/TenantHome';
// client/src/components/dashboards/TenantDashboard.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../UserContext';
import { MaintenanceRequests } from '../maintenance/MaintenanceRequests';
import { useMyPayments } from '../../hooks/useMyPayments';
import { useTenantMaintenance } from '../../hooks/useTenantMaintenance';
import { TenantSummaries, TenantMaintenancePreview } from '../tenant/TenantActivity';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { TenantAnnouncements } from '../announcements/AnnouncementList';
import { TenantPaymentForm } from '../tenant/TenantPaymentForm';
import { TenantMaintenanceForm } from '../tenant/TenantMaintenanceForm';
import { PaymentLedger } from '../payments/PaymentLedger';
import { TenantRules } from '../tenant/TenantRules';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { notify } from '../../utils/notify';
import { TenantMessages } from '../tenant/TenantMessages';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/Layout';
import { EmptyState, ErrorState, LoadingState } from '../ui/Feedback';

interface HousingDetails {
    landlordId: string;
    landlordName: string;
    landlordEmail: string;
    landlordPhone?: string | null;
    roomNumber: string;
    moveInDate: string;
}

export const TenantDashboard: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [housing, setHousing] = useState<HousingDetails | null>(null);
    const [isLoadingHousing, setIsLoadingHousing] = useState(true);
    const [housingError, setHousingError] = useState<string | null>(null);

    // Profile Edit State
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phoneNumber || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const paymentRecords = useMyPayments(user?.id);
    const maintenance = useTenantMaintenance(user?.id);
    const announcements = useAnnouncements(user);
    const { retry: refreshAnnouncements } = announcements;
    const previousActivityPath = useRef(location.pathname);
    const { refresh: refreshPayments } = paymentRecords;
    const { retry: refreshMaintenance } = maintenance;
    useEffect(() => {
        if (previousActivityPath.current === location.pathname) return;
        previousActivityPath.current = location.pathname;
        if (['/', '/payments', '/history'].includes(location.pathname)) refreshPayments();
        if (['/', '/maintenance'].includes(location.pathname)) refreshMaintenance();
        if (['/', '/announcements'].includes(location.pathname)) refreshAnnouncements();
    }, [location.pathname, refreshPayments, refreshMaintenance, refreshAnnouncements]);
    useEffect(() => {
        const refresh = () => { refreshPayments(); refreshMaintenance(); };
        window.addEventListener('focus', refresh);
        return () => window.removeEventListener('focus', refresh);
    }, [refreshPayments, refreshMaintenance]);
    const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditPhone(user.phoneNumber || '');
        }
    }, [user]);

    const loadHousing = useCallback(async () => {
        if (!user?.id) return;
        setIsLoadingHousing(true);
        setHousingError(null);
        try {
            const res = await sessionFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tenant/details/${user.id}`);
            const data = await res.json();
            if (!res.ok || !data || data.error) throw new Error('Housing details unavailable');
            setHousing(data);
        } catch {
            setHousing(null);
            setHousingError('Your room and landlord details could not be loaded. Please try again.');
        } finally { setIsLoadingHousing(false); }
    }, [user?.id]);
    useEffect(() => { loadHousing(); }, [loadHousing]);

    const housingReady = !isLoadingHousing && !housingError && !!housing?.landlordId;
    const isRoomAssigned = housingReady && Boolean(housing?.roomNumber && housing.roomNumber !== 'Unassigned');
    const payments = { data: paymentRecords.payments, loading: paymentRecords.isLoading, error: paymentRecords.error, retry: refreshPayments };
    const receiptId = new URLSearchParams(location.search).get('receipt');

    const viewingRules = location.pathname === '/rules';
    const rulesHeading = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        if (viewingRules) {
            rulesHeading.current?.focus({ preventScroll: true });
            rulesHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
        }
    }, [viewingRules]);
    const paying = location.pathname === '/pay';
    const reporting = location.pathname === '/report';
    const reportHeading = useRef<HTMLHeadingElement>(null);
    const paymentHeading = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        if (reporting) {
            reportHeading.current?.focus({ preventScroll: true });
            reportHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
        }
    }, [reporting]);
    useEffect(() => {
        if (paying) {
            paymentHeading.current?.focus({ preventScroll: true });
            paymentHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
        }
    }, [paying]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !editName.trim()) return;

        setIsUpdatingProfile(true);
        setProfileError(null);
        const toastId = notify.loading('Updating your profile…');
        try {
            const res = await sessionFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/profile/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    phoneNumber: editPhone.trim() || null
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Profile update failed");

            updateUser(data.user);
            notify.success('Profile updated successfully.', { id: toastId });
            setIsEditProfileOpen(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update profile.';
            setProfileError(message); notify.error('Profile could not be updated', { id: toastId, description: message });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    if (!user) return null;

    return (
        <WorkspaceShell role="tenant" user={user} onLogout={logout} onEditProfile={() => setIsEditProfileOpen(true)}>
        <Routes>
            {['/history', '/payments'].map(path => <Route key={path} path={path} element={
                isRoomAssigned ? <PaymentLedger key={receiptId || 'history'} role="tenant" payments={payments.data} loading={payments.loading} error={payments.error} onRetry={refreshPayments} onBack={() => navigate('/')} initialReceiptId={receiptId} /> :
                <div className="space-y-6">
                    <Link to="/" className="df-button df-button--quiet">Back to home</Link>
                    <PageHeader title="Payment history" />
                    {isLoadingHousing ? <LoadingState>Loading housing details…</LoadingState> : housingError ? <ErrorState title="Housing details unavailable" description={housingError} action={<Button variant="secondary" onClick={loadHousing}>Retry details</Button>} /> : <EmptyState title="Room assignment needed" description="Payment history becomes available after your landlord assigns a room." action={<Link to="/chat" className="df-button df-button--secondary">Message landlord</Link>} />}
                </div>
            } />)}
            <Route path="/maintenance" element={<div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/" className="df-button df-button--quiet">Back to home</Link>{isRoomAssigned ? <Link to="/report" className="df-button df-button--primary">Report an issue</Link> : <p className="text-sm text-muted">{isLoadingHousing ? 'Loading your room assignment…' : housingError ? 'Retry housing details on Home before reporting an issue.' : 'Your landlord must assign a room before you can report an issue.'}</p>}</div>
                <MaintenanceRequests role="tenant" standalone requests={maintenance.data} loading={maintenance.loading} error={maintenance.error} onRetry={refreshMaintenance} emptyAction={isRoomAssigned ? <Link to="/report" className="df-button df-button--primary">Report an issue</Link> : housingReady ? <Link to="/chat" className="df-button df-button--secondary">Message landlord</Link> : undefined} />
            </div>} />

            <Route path="/chat" element={<TenantMessages userId={user.id} housing={housing} loading={isLoadingHousing} error={housingError} onRetry={loadHousing} />} />
            <Route path="/announcements" element={<TenantAnnouncements resource={announcements} onSignOut={logout} />} />
            <Route path="*" element={
                <div className="space-y-6">
                    <TenantHome user={user} housing={housing} loading={isLoadingHousing} error={housingError}
                        onRetry={loadHousing} onRules={() => navigate('/rules')} onEditProfile={() => setIsEditProfileOpen(true)}
                        summary={<div className="space-y-6"><TenantSummaries payments={payments} maintenance={maintenance} /><TenantAnnouncements resource={announcements} onSignOut={logout} preview /></div>}>
                        {reporting ? <section aria-labelledby="tenant-report-title" className="df-card space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 id="tenant-report-title" ref={reportHeading} tabIndex={-1} className="df-section-title scroll-mt-28">Report an issue</h2>
                                <Button variant="quiet" disabled={isSubmitting} onClick={() => navigate('/')}>Back to active requests</Button>
                            </div>
                            {isLoadingHousing ? <LoadingState>Loading your room assignment…</LoadingState> : housingError ? <ErrorState title="Housing details unavailable" description={housingError} action={<Button variant="secondary" onClick={loadHousing}>Retry details</Button>} /> : <TenantMaintenanceForm assigned={isRoomAssigned} onBusyChange={setIsSubmitting} onSaved={refreshMaintenance} onDone={() => navigate('/')} />}
                        </section> : paying ? <section aria-labelledby="tenant-payment-title" className="df-card space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 id="tenant-payment-title" ref={paymentHeading} tabIndex={-1} className="df-section-title scroll-mt-28">Submit payment proof</h2>
                                <Button variant="quiet" disabled={isPaymentSubmitting} onClick={() => navigate('/')}>Back to active requests</Button>
                            </div>
                            {isLoadingHousing ? <LoadingState>Loading your room assignment…</LoadingState> : housingError ? <ErrorState title="Housing details unavailable" description={housingError} action={<Button variant="secondary" onClick={loadHousing}>Retry details</Button>} /> : isRoomAssigned && housing?.landlordId ? <TenantPaymentForm landlordId={housing.landlordId} onSaved={refreshPayments} onBusyChange={setIsPaymentSubmitting} onSuccess={() => navigate('/')} /> : <EmptyState title="Room assignment needed" description="Your landlord must assign a room before you can submit payment proof." action={<Link to="/chat" className="df-button df-button--secondary">Message landlord</Link>} />}
                        </section> : viewingRules ? <section aria-labelledby="tenant-rules-title" className="df-card space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 id="tenant-rules-title" ref={rulesHeading} tabIndex={-1} className="df-section-title scroll-mt-28">House rules</h2>
                                <Button variant="quiet" onClick={() => navigate('/')}>Back to active requests</Button>
                            </div>
                            <p className="text-sm text-muted">Rules that apply to your dormitory and room.</p>
                            {isLoadingHousing ? <LoadingState>Loading your housing details…</LoadingState> : housingError ? <ErrorState title="Housing details unavailable" description={housingError} action={<Button variant="secondary" onClick={loadHousing}>Retry details</Button>} /> : housing?.landlordId ? <TenantRules landlordId={housing.landlordId} roomNumber={housing.roomNumber} /> : <EmptyState title="Landlord details unavailable" description="Retry housing details to view your house rules." action={<Button variant="secondary" onClick={loadHousing}>Retry details</Button>} />}
                        </section> : <TenantMaintenancePreview maintenance={maintenance} assigned={isRoomAssigned} housingReady={housingReady} />}
                    </TenantHome>


                </div>
            } />
        </Routes>
        {/* Edit profile remains available across tenant routes. */}
        {isEditProfileOpen && (
            <Dialog open onClose={() => setIsEditProfileOpen(false)} title="Edit profile" busy={isUpdatingProfile}>


                    <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                        {profileError && <ErrorMessage>{profileError}</ErrorMessage>}
                        <div>
                            <label htmlFor="profile-name" className="block text-sm font-semibold text-ink mb-2">Full Name</label>
                            <input id="profile-name" disabled={isUpdatingProfile}
                                type="text"
                                required
                                className="df-control"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="profile-phone" className="block text-sm font-semibold text-ink mb-2">Phone Number</label>
                            <input id="profile-phone" disabled={isUpdatingProfile}
                                type="tel"
                                placeholder="09123456789"
                                className="df-control"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                disabled={isUpdatingProfile} onClick={() => setIsEditProfileOpen(false)}
                                className="df-button df-button--secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdatingProfile || !editName.trim()}
                                className="df-button df-button--primary"
                            >
                                {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

            </Dialog>
        )}

        </WorkspaceShell>
    );
};
