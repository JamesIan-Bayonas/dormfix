import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '../../src/index.css';
import { ToastViewport } from '../../src/components/ui/ToastViewport';
import { AppearanceControl } from '../../src/components/ui/AppearanceControl';
import { Dialog } from '../../src/components/ui/Dialog';
import { Button } from '../../src/components/ui/Button';
import { PaymentProofForm } from '../../src/components/payments/PaymentProofForm';
import { MaintenanceRequestForm } from '../../src/components/maintenance/MaintenanceRequestForm';
import { RuleForm } from '../../src/components/rules/RuleForm';
import { AddRoomDialog } from '../../src/components/landlord/AddRoomDialog';
import { useRecordAction } from '../../src/hooks/useRecordAction';
import { notify } from '../../src/utils/notify';

export default function Fixture() {
    const [open, setOpen] = useState(false);
    const [nested, setNested] = useState(false);
    const [room, setRoom] = useState(false);
    const [mode, setMode] = useState('success');
    const [view, setView] = useState('maintenance');
    const [calls, setCalls] = useState(0);
    const action = useRecordAction();
    const perform = async () => {
        setCalls(value => value + 1);
        await new Promise(resolve => setTimeout(resolve, 400));
        if (mode === 'throw') throw new Error('Simulated connection failure.');
        return mode !== 'failure';
    };
    const submit = async () => { if (!await perform()) throw new Error('Submission could not be confirmed.'); return { status: mode === 'warning' ? 'Anomalous' : 'Verified', warnings: [] }; };
    return <main className="min-h-dvh bg-canvas p-6 text-ink">
        <ToastViewport />
        <div className="mx-auto max-w-reading space-y-5">
            <h1 className="df-page-title">DormFix toast verification</h1><p>Fictional actions only. No requests or database writes.</p><AppearanceControl />
            <div><label htmlFor="outcome">Outcome</label><select id="outcome" className="df-control" value={mode} onChange={event => setMode(event.target.value)}>{['success', 'failure', 'throw', 'warning'].map(value => <option key={value}>{value}</option>)}</select></div>
            <div><label htmlFor="form">Form</label><select id="form" className="df-control" value={view} onChange={event => { notify.clear(); setView(event.target.value); }}>{['maintenance', 'payment', 'rule'].map(value => <option key={value}>{value}</option>)}</select></div>
            <div className="flex flex-wrap gap-3">
                <Button onClick={() => notify.success('Request submitted', { id: 'demo', duration: 60000, description: 'Your request is recorded and awaiting review.' })}>Show success</Button>
                <Button onClick={() => notify.error('Upload failed', { id: 'demo', duration: 60000, description: 'Check your connection and payment history before retrying.' })}>Show error</Button>
                <Button onClick={() => notify.info('Short notice', { id: 'short', duration: 500 })}>Short notice</Button>
                <Button onClick={() => setOpen(true)}>Open modal</Button><Button onClick={() => setRoom(true)}>Add room</Button>
                <Button onClick={() => { void action.run('record', perform, 'Refresh records before retrying.', 'Record updated.'); }}>Save record</Button>
                <Button onClick={notify.clear}>Clear notifications</Button>
            </div><p>Calls: {calls}</p>
            <div className="df-panel" key={view}>{view === 'maintenance' ? <MaintenanceRequestForm onSubmit={submit} onDone={() => {}} /> : view === 'payment' ? <PaymentProofForm onSubmit={submit} /> : <RuleForm rooms={[]} roomsLoading={false} roomsError={null} onRetryRooms={() => {}} onAdd={perform} />}</div>
        </div>
        <Dialog open={open} onClose={() => setOpen(false)} title="Toast modal">
            <Button onClick={() => notify.error('Modal action failed', { id: 'modal', duration: 60000 })}>Fail modal action</Button><Button onClick={() => setNested(true)}>Open nested modal</Button>
        </Dialog>
        <Dialog open={nested} onClose={() => setNested(false)} title="Nested modal"><Button onClick={() => notify.warning('Nested warning', { id: 'modal', duration: 60000 })}>Show nested warning</Button></Dialog>
        <AddRoomDialog open={room} onClose={() => setRoom(false)} onSave={perform} />
    </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><Fixture /></HashRouter></StrictMode>);
