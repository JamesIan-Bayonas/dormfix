import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Link, useLocation } from 'react-router-dom';
import '../../src/index.css';
import type { LandlordMaintenanceRequest, MaintenanceStatus } from '../../src/types/types';
import type { HouseRule } from '../../src/services/ruleService';
import { maintenanceBody, replaceMaintenanceStatus } from '../../src/utils/maintenancePresentation';
import { applicableRules } from '../../src/utils/rulesPresentation';
import { MaintenanceRequests } from '../../src/components/maintenance/MaintenanceRequests';
import { MaintenanceRequestForm } from '../../src/components/maintenance/MaintenanceRequestForm';
import { RulesWorkspace } from '../../src/components/rules/RulesWorkspace';
import { RulesCollection } from '../../src/components/rules/RulesCollection';
import { WorkspaceShell } from '../../src/components/ui/WorkspaceShell';
import { Dialog } from '../../src/components/ui/Dialog';
import { Button } from '../../src/components/ui/Button';
import { PageHeader } from '../../src/components/ui/Layout';

const originalRequests: LandlordMaintenanceRequest[] = [
    { id: 'm1', tenantId: 't1', tenantName: 'Alex Rivera', roomNumber: '108', issueType: 'Plumbing', urgency: 'Emergency', status: 'Pending', dateSubmitted: '2026-10-03', description: 'The sink pipe leaks whenever the tap is turned on.\nWater reaches the cupboard and the floor. The valve is difficult to reach behind the cupboard.\nPlease check the connection under the basin. This last sentence must remain visible.' },
    { id: 'm2', tenantId: 't2', tenantName: 'Jamie Santos', roomNumber: '109', issueType: 'Electrical', urgency: 'High', status: 'In Progress', dateSubmitted: '2026-10-02', description: 'The main light is flickering. Please check the ceiling fitting.' },
    { id: 'm3', tenantId: 't1', tenantName: 'Alex Rivera', roomNumber: '108', issueType: 'Appliance', urgency: 'Low', status: 'Completed', dateSubmitted: '2026-09-01', description: 'The fan was repaired.' },
    { id: 'm4', tenantId: 't1', tenantName: 'Alex Rivera', roomNumber: '108', issueType: 'Other', urgency: 'Medium', status: 'Rejected', dateSubmitted: '2026-09-03', description: 'A previously rejected request.', adminRemarks: 'Please clarify the location with your landlord.' },
];
const originalRules: HouseRule[] = [
    { id: 'r1', rule_text: 'Keep the shared kitchen clean.\nWipe surfaces after use and put rubbish in the marked bins.', category: 'Cleanliness', target_room_number: null },
    { id: 'r2', rule_text: 'Keep the room 108 exit clear.\nDo not store bags or furniture in front of the door.', category: 'Safety', target_room_number: '108', is_priority: true },
    { id: 'r3', rule_text: 'Room 109: guests must leave by the stated visiting time.', category: 'Guests', target_room_number: '109' },
    { id: 'r4', rule_text: 'Quiet hours apply across the dormitory.', category: 'Noise', target_room_number: 'Global', is_priority: true },
];
const pause = (ms = 1400) => new Promise(resolve => setTimeout(resolve, ms));

/* Real UI components with simulated outcomes. No auth, API requests, notifications, or persisted writes. */
export default function MaintenanceRulesFixture() {
    const { pathname } = useLocation();
    const tenant = pathname === '/tenant';
    const [requests, setRequests] = useState(originalRequests);
    const [rules, setRules] = useState(originalRules);
    const [mode, setMode] = useState('Populated');
    const [reportOpen, setReportOpen] = useState(false);
    const [reportBusy, setReportBusy] = useState(false);
    const [rulesOpen, setRulesOpen] = useState(false);
    const [reportCount, setReportCount] = useState(0);
    const [payload, setPayload] = useState('');
    const attempts = useRef(new Set<string>());
    const counter = useRef(0);
    const pendingStatus = useRef(new Set<string>());
    const loading = mode === 'Loading';
    const error = mode === 'Read failure' ? 'Simulated read failure. Data is unavailable, not assumed empty.' : null;
    const retry = () => setMode('Populated');
    async function firstFails(key: string) { await pause(); if (attempts.current.has(key)) return false; attempts.current.add(key); return true; }
    async function status(id: string, next: MaintenanceStatus) {
        const previous = requests.find(request => request.id === id)?.status;
        if (!previous || pendingStatus.current.has(id)) return false;
        pendingStatus.current.add(id);
        setRequests(current => replaceMaintenanceStatus(current, id, next));
        const fails = await firstFails(`status-${id}`);
        if (fails) setRequests(current => replaceMaintenanceStatus(current, id, previous));
        pendingStatus.current.delete(id);
        return !fails;
    }
    return <>
        <div className="space-y-3 border-b border-divider bg-info-soft p-4 text-sm text-info"><p>Isolated Group 5 fixture: fictional data, simulated callbacks, no server requests or saved records. First action fails; retry succeeds.</p>
            <div className="flex flex-wrap gap-3"><Link to="/maintenance" className="df-button df-button--secondary">Landlord maintenance</Link><Link to="/rules" className="df-button df-button--secondary">Landlord rules</Link><Link to="/tenant" className="df-button df-button--secondary">Tenant preview</Link></div>
            <label htmlFor="fixture-state" className="block">Data state</label><select id="fixture-state" className="df-control max-w-sm" value={mode} onChange={event => setMode(event.target.value)}>{['Populated', 'Loading', 'Read failure', 'Room read failure', 'Empty', 'Saved rule / refresh failure'].map(value => <option key={value}>{value}</option>)}</select>
            <p>Simulated report calls: {reportCount}. {payload}</p>
        </div>
        <WorkspaceShell role={tenant ? 'tenant' : 'landlord'} user={{ name: 'Fixture resident', dormFixId: 'FIXTURE' }} onLogout={() => {}}>
            {pathname === '/rules' ? <RulesWorkspace rules={mode === 'Empty' ? [] : rules} loading={loading} error={error || (mode === 'Saved rule / refresh failure' ? 'Rule is saved; its list refresh failed.' : null)} rooms={[{ room_number: '108' }, { room_number: '109' }]} roomsLoading={loading} roomsError={mode === 'Room read failure' ? 'Simulated room choices failure.' : null} onRetry={retry} onRetryRooms={retry}
                onAdd={async fields => { setPayload(`Rule payload: landlordId, ruleText, roomNumber, category, isPriority. Scope: ${fields.roomNumber === 'Global' ? 'null' : fields.roomNumber}.`); if (await firstFails('add-rule')) return false; const id = `new-${++counter.current}`; setRules(current => [{ id, rule_text: fields.ruleText, target_room_number: fields.roomNumber === 'Global' ? null : fields.roomNumber, category: fields.category as HouseRule['category'], is_priority: fields.isPriority }, ...current]); return true; }}
                onDelete={async id => { if (await firstFails(`delete-${id}`)) return false; setRules(current => current.filter(rule => rule.id !== id)); return true; }} /> : tenant ? <div className="space-y-6"><PageHeader title="Tenant preview" description="Actual maintenance and rules components, with fictional records." /><div className="flex flex-wrap gap-3"><Button onClick={() => setReportOpen(true)}>Report an issue</Button><Button variant="secondary" onClick={() => setRulesOpen(true)}>House rules</Button></div><MaintenanceRequests role="tenant" requests={mode === 'Empty' ? [] : requests.filter(request => request.tenantId === 't1' || request.tenantId === 'fixture')} loading={loading} error={error} onRetry={retry} /></div> : <MaintenanceRequests role="landlord" requests={mode === 'Empty' ? [] : requests} loading={loading} error={error} onRetry={retry} onChangeStatus={status} />}
        </WorkspaceShell>
        <Dialog open={reportOpen} onClose={() => setReportOpen(false)} title="Report an issue" busy={reportBusy}>
            <MaintenanceRequestForm onBusyChange={setReportBusy} onDone={() => setReportOpen(false)} onSubmit={async fields => {
                setReportCount(current => current + 1); setPayload(`Report fields: ${Object.keys(maintenanceBody('fixture-tenant', fields)).join(', ')}.`);
                if (await firstFails('report')) throw new Error('Simulated report submission failure.');
                setRequests(current => [{ id: 'new-report', tenantId: 'fixture', tenantName: 'Fixture resident', roomNumber: '108', dateSubmitted: '2026-10-03', status: 'Pending', ...fields } as LandlordMaintenanceRequest, ...current]);
                return { message: 'Request submitted', aiReply: 'Simulated reply which is not a dispatch confirmation.' };
            }} />
        </Dialog>
        <Dialog open={rulesOpen} onClose={() => setRulesOpen(false)} title="House rules" description="Rules applicable to room 108 and all rooms.">
            <RulesCollection rules={mode === 'Empty' ? [] : applicableRules(rules, '108')} loading={loading} error={error} onRetry={retry} />
            <div className="flex justify-end"><Button onClick={() => setRulesOpen(false)}>Close house rules</Button></div>
        </Dialog>
    </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><MaintenanceRulesFixture /></HashRouter></StrictMode>);
