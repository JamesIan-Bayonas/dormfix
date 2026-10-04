import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Link, useLocation } from 'react-router-dom';
import '../../src/index.css';
import { WorkspaceShell } from '../../src/components/ui/WorkspaceShell';
import { PaymentLedger } from '../../src/components/payments/PaymentLedger';
import { PaymentProofForm } from '../../src/components/payments/PaymentProofForm';
import { TenantDirectory, type DirectoryTenant } from '../../src/components/landlord/TenantDirectory';
import { Dialog } from '../../src/components/ui/Dialog';
import { Button } from '../../src/components/ui/Button';
import { PageHeader } from '../../src/components/ui/Layout';
import { verdictRemarks } from '../../src/utils/paymentPresentation';
import { paymentFormData } from '../../src/utils/paymentSubmission';
import type { Payment } from '../../src/types/types';

const initialPayments: Payment[] = [
    { id: 'p1', tenantName: 'Alex Rivera', roomNumber: '108', amount: 2500, paymentType: 'Rent', datePaid: '2026-10-03', status: 'Pending', proofImage: '/tests/fixtures/receipt.svg', remarks: '[AI Audit: Verified]\n[AI Extracted: ₱2500]\n[Ref No: TEST-123]\n[Warnings: None]\nTenant Remarks: October rent.\nPlease check the reference.' },
    { id: 'p2', tenantName: 'Jamie Santos', roomNumber: '109', amount: 400, paymentType: 'Water', datePaid: '2026-10-03', status: 'Anomalous', proofImage: '/tests/fixtures/receipt.svg', remarks: '[AI Audit: Anomalous]\n[AI Extracted: ₱400]\n[Warnings: Date unavailable | Receipt total differs]\nTenant Remarks: Water payment.' },
    { id: 'p3', tenantName: 'Alex Rivera', roomNumber: '108', amount: 2500, paymentType: 'Rent', datePaid: '2026-09-03', status: 'Verified', proofImage: '', remarks: 'Legacy note\n[AI Verified: YES]\n[Extracted Amount: ₱2500]\n[Ref: OLD-1]' },
    { id: 'p4', tenantName: 'Jamie Santos', roomNumber: '109', amount: 350, paymentType: 'Electric', datePaid: '2026-09-04', status: 'Rejected', proofImage: '', remarks: verdictRemarks('Plain tenant note', 'Rejected', 'The receipt is cropped. Please include the complete reference.') },
];
const initialTenants: DirectoryTenant[] = [{ id: 't1', name: 'Pending Alex', email: 'alex@example.test', isApproved: false }, { id: 't2', name: 'Pending Jamie', email: 'jamie@example.test', isApproved: false }, { id: 't3', name: 'Approved Morgan', email: 'morgan@example.test', isApproved: true, roomNumber: 'Unassigned' }, { id: 't4', name: 'Assigned Casey', email: 'casey@example.test', isApproved: true, roomNumber: '110', phoneNumber: 'Fixture phone unavailable' }];
const initialRooms = [{ room_number: '108', capacity: 2, currentOccupants: 1 }, { room_number: '109', capacity: 3, currentOccupants: 0 }, { room_number: '110', capacity: 1, currentOccupants: 1 }];
const pause = () => new Promise(resolve => setTimeout(resolve, 1600));

/* Simulated presentation workflows only. No authentication, fetch, sockets, or server writes. */
export default function Fixture() {
    const { pathname } = useLocation();
    const [payments, setPayments] = useState(initialPayments);
    const [tenants, setTenants] = useState(initialTenants);
    const [rooms, setRooms] = useState(initialRooms);
    const [mode, setMode] = useState('Populated');
    const [response, setResponse] = useState('Anomalous');
    const [proofOpen, setProofOpen] = useState(false);
    const [proofBusy, setProofBusy] = useState(false);
    const [proofCount, setProofCount] = useState(0);
    const [payload, setPayload] = useState('');
    const attempts = useRef(new Set<string>());
    const tenantRole = pathname === '/history' || pathname === '/proof';
    const loading = mode === 'Loading';
    const error = mode === 'Read failure' ? 'Simulated read failure. Nothing is assumed empty.' : null;
    const retry = () => setMode('Populated');
    const back = () => { setMode('Populated'); };
    async function firstFails(key: string) {
        await pause();
        if (!attempts.current.has(key)) { attempts.current.add(key); return true; }
        return false;
    }
    return <>
        <div className="space-y-3 border-b border-divider bg-info-soft p-4 text-sm text-info">
            <p>Isolated Group 4 fixture: fictional records. No server requests, account changes, or financial transactions. First record action fails; retry succeeds.</p>
            <div className="flex flex-wrap gap-3">{[['/payments', 'Landlord receipts'], ['/tenants', 'Tenant directory'], ['/history', 'Tenant receipts'], ['/proof', 'Submit proof']].map(([path, label]) => <Link key={path} to={path} className="df-button df-button--secondary">{label}</Link>)}</div>
            <div className="flex flex-wrap items-center gap-3"><label htmlFor="fixture-state">Data state</label><select id="fixture-state" className="df-control w-auto max-w-full" value={mode} onChange={event => setMode(event.target.value)}>{['Populated', 'Loading', 'Read failure', 'Room read failure', 'Empty'].map(value => <option key={value}>{value}</option>)}</select><label htmlFor="fixture-response">Upload response</label><select id="fixture-response" className="df-control w-auto max-w-full" value={response} onChange={event => setResponse(event.target.value)}>{['Anomalous', 'Verified', 'Missing status', 'Failure'].map(value => <option key={value}>{value}</option>)}</select></div>
            <p>Simulated upload calls: {proofCount}. {payload}</p>
        </div>
        <WorkspaceShell role={tenantRole ? 'tenant' : 'landlord'} user={{ name: 'Fixture user', dormFixId: 'FIXTURE' }} onLogout={() => {}}>
            {pathname === '/tenants' ? <TenantDirectory tenants={mode === 'Empty' ? [] : tenants} rooms={rooms} loading={loading} error={error} roomsLoading={loading} roomsError={mode === 'Room read failure' ? 'Simulated room read failure.' : null} onRetry={retry} onRetryRooms={() => { retry(); setRooms(current => current.map(room => room.room_number === '108' ? { ...room, currentOccupants: room.capacity } : room)); }} onBack={back}
                onApprove={async id => { if (await firstFails(`approve-${id}`)) return false; setTenants(current => current.map(tenant => tenant.id === id ? { ...tenant, isApproved: true } : tenant)); return true; }}
                onRemove={async id => { if (await firstFails(`remove-${id}`)) return false; setTenants(current => current.filter(tenant => tenant.id !== id)); return true; }}
                onAssign={async (id, roomNumber) => { if (await firstFails(`assign-${id}`)) throw new Error('Room 108 is now full. Refresh availability and choose another room.'); setTenants(current => current.map(tenant => tenant.id === id ? { ...tenant, roomNumber } : tenant)); return true; }} /> : pathname === '/proof' ? <div className="space-y-6"><PageHeader title="Submit payment proof" description="Preview the actual submission form with simulated responses." /><Button onClick={() => setProofOpen(true)}>Open proof form</Button></div> : <PaymentLedger key={tenantRole ? 'tenant' : 'landlord'} role={tenantRole ? 'tenant' : 'landlord'} payments={mode === 'Empty' ? [] : payments} loading={loading} error={error} onRetry={retry} onBack={back} receiptBase={location.origin}
                onVerify={async (id, status, reason) => { if (await firstFails(`verify-${id}`)) return false; setPayments(current => current.map(payment => payment.id === id ? { ...payment, status, remarks: verdictRemarks(payment.remarks, status, reason) } : payment)); return true; }} />}
        </WorkspaceShell>
        <Dialog open={proofOpen} onClose={() => setProofOpen(false)} title="Submit payment proof" busy={proofBusy}>
            <PaymentProofForm onBusyChange={setProofBusy} onDone={() => setProofOpen(false)} onSubmit={async fields => {
                setProofCount(current => current + 1);
                const data = paymentFormData('fixture-tenant', 'fixture-landlord', fields);
                setPayload(`Fields: ${[...data.keys()].join(', ')}. Type: ${fields.paymentType}. Attachment: ${fields.proof.name}.`);
                await pause();
                if (response === 'Failure') { setResponse('Anomalous'); throw new Error('Simulated upload response failure.'); }
                return response === 'Missing status' ? {} : { status: response, warnings: response === 'Anomalous' ? ['The receipt date could not be read.'] : [] };
            }} />
        </Dialog>
    </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><Fixture /></HashRouter></StrictMode>);
