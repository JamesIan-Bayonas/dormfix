import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import '../../src/index.css';
import { WorkspaceShell } from '../../src/components/ui/WorkspaceShell';
import { LandlordOverview } from '../../src/components/landlord/LandlordOverview';
import { TenantHome } from '../../src/components/tenant/TenantHome';
import { Dialog } from '../../src/components/ui/Dialog';
import { PageHeader, Panel } from '../../src/components/ui/Layout';
import { Button } from '../../src/components/ui/Button';
import type { Payment, LandlordMaintenanceRequest } from '../../src/types/types';

const tenants = [
    { id: 't1', name: 'Alex Rivera', email: 'fixture@example.test', roomNumber: '108', isApproved: true, createdAt: '2026-10-01' },
    { id: 't2', name: 'Unassigned fixture tenant', email: 'fixture@example.test', roomNumber: 'Unassigned', isApproved: true, createdAt: '2026-10-02' },
    { id: 't3', name: 'Pending fixture applicant', email: 'fixture@example.test', isApproved: false },
];
const rooms = [{ id: 'r1', room_number: '108', capacity: 3, currentOccupants: 1 }, { id: 'r2', room_number: 'West A', capacity: 2, currentOccupants: 0 }];
const payments: Payment[] = [
    { id: 'p1', tenantName: 'Alex Rivera', amount: 2500, paymentType: 'Rent', status: 'Pending', datePaid: '2026-10-02', proofImage: '' },
    { id: 'p2', tenantName: 'Alex Rivera', amount: 500, paymentType: 'Other', status: 'Anomalous', datePaid: '2026-10-03', proofImage: '' },
];
const requests: LandlordMaintenanceRequest[] = [{ id: 'm1', tenantId: 't1', tenantName: 'Alex Rivera', roomNumber: '108', issueType: 'Plumbing', description: 'Fixture request', urgency: 'High', status: 'Pending', dateSubmitted: '2026-10-03' }];
const housing = { landlordId: 'fixture', landlordName: 'Fixture landlord', landlordEmail: 'landlord@example.test', roomNumber: '108', moveInDate: '2026-10-01' };

/* Standalone preview of real presentation components. No auth provider, fetch, sockets, or mutations. */
export default function WorkspaceFixture() {
    const [role, setRole] = useState<'landlord' | 'tenant'>('landlord');
    const [mode, setMode] = useState('Populated');
    const [notice, setNotice] = useState<string | null>(null);
    const empty = mode === 'Empty';
    const loading = mode === 'Loading';
    const partial = mode === 'Partial failure';
    const retry = () => setMode('Populated');
    const roomDetails = (empty ? [] : rooms).map(room => ({ ...room, status: 'occupied' as const, occupants: tenants.filter(tenant => tenant.roomNumber === room.room_number), occupantPaymentStatus: [], activeIssues: requests.filter(request => request.roomNumber === room.room_number), hasIssue: room.id === 'r1', isCritical: room.id === 'r1' }));
    const user = { name: 'Fixture resident', email: 'resident@example.test', dormFixId: 'FIXTURE-ONLY', phoneNumber: '' };
    return <>
        <div className="border-b border-divider bg-info-soft p-4 text-sm text-info">
            <p className="mb-3">Isolated frontend fixture: fictional data, simulated states, no backend requests. Secondary routes below are preview placeholders.</p>
            <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={() => setRole('landlord')}>Preview landlord</Button>
                <Button variant="secondary" onClick={() => setRole('tenant')}>Preview tenant</Button>
                <label htmlFor="fixture-state">Preview state</label><select id="fixture-state" className="df-control w-auto max-w-full" value={mode} onChange={event => setMode(event.target.value)}>
                    {['Populated', 'Empty', 'Partial failure', 'Loading'].map(value => <option key={value}>{value}</option>)}
                </select>
            </div>
        </div>
        <WorkspaceShell role={role} user={user} onLogout={() => setNotice('Sign out fixture — no session exists')} onEditProfile={() => setNotice('Edit profile fixture')}>
            <Routes>
                <Route path="/" element={role === 'landlord' ? <LandlordOverview
                    rooms={{ data: empty ? [] : rooms, loading, error: null, retry }} tenants={{ data: empty ? [] : tenants, loading, error: null, retry }}
                    payments={{ data: empty ? [] : payments, loading, error: partial ? 'Simulated payment read failure. Counts are unavailable.' : null, retry }}
                    maintenance={{ data: empty ? [] : requests, loading, error: null, retry }}
                    roomDetails={roomDetails} onOpenRoom={id => setNotice(`Room ${rooms.find(room => room.id === id)?.room_number} fixture`)} /> :
                    <TenantHome user={user} housing={partial ? null : { ...housing, roomNumber: empty ? 'Unassigned' : '108' }} loading={loading} error={partial ? 'Simulated housing read failure.' : null}
                        onRetry={retry} onRules={() => setNotice('House rules fixture')} onEditProfile={() => setNotice('Edit profile fixture')}>
                        <Panel><h2 className="df-section-title">Your maintenance requests</h2><p className="mt-2 text-sm text-muted">Fixture placeholder for the existing maintenance component.</p></Panel>
                    </TenantHome>} />
                {['payments', 'maintenance', 'tenants', 'rooms', 'chat', 'rules', 'pay', 'report', 'history'].map(path => <Route key={path} path={`/${path}`} element={<div className="space-y-6"><PageHeader title={`${path.charAt(0).toUpperCase()}${path.slice(1)} route fixture`} description="Navigation-only placeholder; no real records or actions." /><Link to="/" className="df-button df-button--secondary">Back to home</Link></div>} />)}
            </Routes>
            <Dialog open={!!notice} title={notice || 'Fixture'} onClose={() => setNotice(null)}><p>This action is simulated; no records or sessions are changed.</p></Dialog>
        </WorkspaceShell>
    </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><WorkspaceFixture /></HashRouter></StrictMode>);
