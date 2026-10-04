import { Dialog } from '../ui/Dialog';
import { ErrorMessage } from '../ui/Feedback';
import { WorkspaceShell } from '../ui/WorkspaceShell';
import { TenantHome } from '../tenant/TenantHome';
// client/src/components/dashboards/TenantDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../UserContext';
import { MaintenanceList } from '../MaintenanceList';
import { TenantPaymentForm } from '../tenant/TenantPaymentForm'; 
import { TenantMaintenanceForm } from '../tenant/TenantMaintenanceForm';
import { TenantPaymentHistory } from '../tenant/TenantPaymentHistory';
import { TenantRulesModal } from '../tenant/TenantRulesModal';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TenantMessages } from '../tenant/TenantMessages';
import { Button } from '../ui/Button';
import { PageHeader, Panel } from '../ui/Layout';
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
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    
    // Profile Edit State
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phoneNumber || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [maintenanceRefresh, setMaintenanceRefresh] = useState(0);
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
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tenant/details/${user.id}`);
            const data = await res.json();
            if (!res.ok || !data || data.error) throw new Error('Housing details unavailable');
            setHousing(data);
        } catch {
            setHousing(null);
            setHousingError('Your room and landlord details could not be loaded. Please try again.');
        } finally { setIsLoadingHousing(false); }
    }, [user?.id]);
    useEffect(() => { loadHousing(); }, [loadHousing]);

    const isRoomAssigned = Boolean(housing?.roomNumber && housing.roomNumber !== 'Unassigned');

    const activeModal = (location.pathname.includes('/pay') && isRoomAssigned) 
        ? 'payment' 
        : (location.pathname.includes('/report') && isRoomAssigned) 
            ? 'maintenance' 
            : null;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !editName.trim()) return;

        setIsUpdatingProfile(true);
        setProfileError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/profile/${user.id}`, {
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
            toast.success("Profile updated successfully!");
            setIsEditProfileOpen(false);
        } catch (err: unknown) {
            setProfileError(err instanceof Error ? err.message : "Failed to update profile.");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    if (!user) return null;

    return (
        <WorkspaceShell role="tenant" user={user} onLogout={logout} onEditProfile={() => setIsEditProfileOpen(true)}>
        <Routes>
            <Route path="/history" element={
                isRoomAssigned ? (
                    <div className="space-y-6">
                        <div className="space-y-6">
                            <TenantPaymentHistory onBack={() => navigate('/')} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <Button variant="quiet" onClick={() => navigate('/')}>Back to home</Button>
                        <PageHeader title="Payment history" />
                        {isLoadingHousing ? <LoadingState>Loading housing details…</LoadingState> : housingError ?
                            <ErrorState title="Housing details unavailable" description={housingError} action={<Button variant="secondary" onClick={loadHousing}>Retry details</Button>} /> :
                            <Panel><EmptyState title="Room assignment needed" description="Payment history becomes available after your landlord assigns a room." action={<Button variant="secondary" onClick={() => navigate('/')}>Back to home</Button>} /></Panel>}
                    </div>
                )
            } />

            <Route path="/chat" element={<TenantMessages userId={user.id} housing={housing} loading={isLoadingHousing} error={housingError} onRetry={loadHousing} />} />
            <Route path="*" element={
                <div className="space-y-6">
                    <TenantHome user={user} housing={housing} loading={isLoadingHousing} error={housingError}
                        onRetry={loadHousing} onRules={() => setIsRulesModalOpen(true)} onEditProfile={() => setIsEditProfileOpen(true)}>
                        <MaintenanceList refreshKey={maintenanceRefresh} />
                    </TenantHome>

                    {activeModal === 'maintenance' && (
                        <Dialog open onClose={() => navigate('/')} title="Report an issue" busy={isSubmitting}>


                                <TenantMaintenanceForm assigned={isRoomAssigned} onBusyChange={setIsSubmitting} onSaved={() => setMaintenanceRefresh(current => current + 1)} onDone={() => navigate('/')} />

                        </Dialog>
                    )}

                    {activeModal === 'payment' && (
                        <Dialog open onClose={() => navigate('/')} title="Submit payment proof" busy={isPaymentSubmitting}>


                                {housing?.landlordId ? <TenantPaymentForm landlordId={housing.landlordId} onBusyChange={setIsPaymentSubmitting} onSuccess={() => navigate('/')} /> : <ErrorState title="Landlord details unavailable" description="Your landlord details could not be loaded. Close this dialog and retry housing details before submitting payment proof." />}

                        </Dialog>
                    )}

                    {housing?.landlordId && (
                        <TenantRulesModal
                            isOpen={isRulesModalOpen}
                            onClose={() => setIsRulesModalOpen(false)}
                            landlordId={housing.landlordId}
                            roomNumber={housing.roomNumber}
                        />
                    )}
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
