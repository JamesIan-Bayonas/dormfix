import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '../../src/index.css';
import { TenantDirectory, type DirectoryTenant } from '../../src/components/landlord/TenantDirectory';
import { WorkspaceShell } from '../../src/components/ui/WorkspaceShell';

const original: DirectoryTenant[] = [
    { id: '1', name: 'Ethan Flores (Demo)', email: 'demo.tenant07@example.com', isApproved: true, roomNumber: '204' },
    { id: '2', name: 'Chloe Mendoza (Demo)', email: 'demo.tenant08@example.com', isApproved: true, roomNumber: '204' },
    { id: '3', name: 'Lucas Torres (Demo)', email: 'demo.tenant09@example.com', isApproved: true, roomNumber: '205' },
    { id: '4', name: 'Ava Castillo (Demo)', email: 'demo.tenant10@example.com', isApproved: true, roomNumber: '205' },
    { id: '5', name: 'Jamie Santos', email: 'jamie@example.com', phoneNumber: '09123456789', isApproved: true },
    { id: '6', name: 'Alex Rivera', email: 'alex@example.com', isApproved: false },
];
export default function Fixture() {
    const [tenants, setTenants] = useState(original);
    const [fail, setFail] = useState(false);
    const [calls, setCalls] = useState(0);
    const wait = () => new Promise(resolve => setTimeout(resolve, 700));
    return <><div className="border-b border-divider bg-info-soft p-3 text-sm text-info">Design preview · fictional tenants · no server writes. <label><input type="checkbox" checked={fail} onChange={event => setFail(event.target.checked)} /> Simulate removal failure</label><span role="status"> Removal calls: {calls}</span></div>
        <WorkspaceShell role="landlord" user={{ name: 'Landlord', dormFixId: 'DEMO' }} onLogout={() => {}}>
            <TenantDirectory tenants={tenants} rooms={[{ room_number: '206', capacity: 4, currentOccupants: 0 }]} loading={false} error={null} roomsLoading={false} roomsError={null} onRetry={() => {}} onRetryRooms={() => {}} onBack={() => {}}
                onApprove={async id => { await wait(); setTenants(items => items.map(item => item.id === id ? { ...item, isApproved: true } : item)); return true; }}
                onAssign={async (id, roomNumber) => { await wait(); setTenants(items => items.map(item => item.id === id ? { ...item, roomNumber } : item)); return true; }}
                onRemove={async id => { setCalls(count => count + 1); await wait(); if (fail) return false; setTenants(items => items.filter(item => item.id !== id)); return true; }} />
        </WorkspaceShell></>;
}
createRoot(document.getElementById('root')!).render(<HashRouter><Fixture /></HashRouter>);
