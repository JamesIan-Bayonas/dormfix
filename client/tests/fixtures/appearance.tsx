import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster, toast } from 'react-hot-toast';
import '../../src/index.css';
import { AppearanceHeader } from '../../src/components/ui/AppearanceHeader';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { Button } from '../../src/components/ui/Button';
import { Dialog } from '../../src/components/ui/Dialog';
import { FormField, Input, Textarea } from '../../src/components/ui/FormField';
import { ErrorMessage, LoadingState } from '../../src/components/ui/Feedback';
import { Panel, PageHeader } from '../../src/components/ui/Layout';
import { StatusBadge } from '../../src/components/ui/StatusBadge';

/* Real shared presentation; no authentication, network requests or record mutations. */
export default function AppearanceFixture() {
    const [view, setView] = useState('Components');
    const [draft, setDraft] = useState('Retained appearance fixture draft');
    const [open, setOpen] = useState(false);
    const [dialogDraft, setDialogDraft] = useState('Dialog draft stays through a cross-tab theme change');
    const fields = <>
        <FormField label="Email address">{field => <Input {...field} type="email" placeholder="you@example.com" />}</FormField>
        <FormField label="Password">{field => <Input {...field} type="password" />}</FormField>
        <Button className="w-full" onClick={() => setOpen(true)}>Preview sign in</Button>
    </>;
    return <>
        <div className="flex flex-wrap items-center gap-3 border-b border-divider bg-info-soft p-4 text-sm text-info">
            <p>Isolated appearance fixture. Fictional content; no sign-in or backend actions.</p>
            <label htmlFor="appearance-view">Preview view</label>
            <select id="appearance-view" className="df-control w-auto" value={view} onChange={event => setView(event.target.value)}>
                {['Components', 'Login', 'Registration'].map(value => <option key={value}>{value}</option>)}
            </select>
        </div>
        {view === 'Components' ? <main className="df-page space-y-6">
            <AppearanceHeader />
            <PageHeader title="Appearance and component states" description="Shared production controls, feedback and overlays in both themes." />
            <div className="grid gap-6 lg:grid-cols-2">
                <Panel className="space-y-4"><h2 className="df-section-title">Actions</h2><div className="flex flex-wrap gap-3">
                    <Button onClick={() => setOpen(true)}>Open dialog</Button><Button variant="secondary">Secondary action</Button>
                    <Button variant="quiet">Quiet action</Button><Button variant="danger">Destructive sample</Button>
                    <Button disabled>Unavailable action</Button><Button loading loadingText="Saving…">Save</Button>
                </div><div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={() => toast.success('Fixture success feedback')}>Success toast</Button><Button variant="secondary" onClick={() => toast.error('Fixture error feedback')}>Error toast</Button></div></Panel>
                <Panel className="space-y-4"><h2 className="df-section-title">Status and feedback</h2><div className="flex flex-wrap gap-2">
                    <StatusBadge>Available</StatusBadge><StatusBadge tone="info">In progress</StatusBadge><StatusBadge tone="success">Completed</StatusBadge>
                    <StatusBadge tone="warning">Awaiting review</StatusBadge><StatusBadge tone="error">Rejected</StatusBadge>
                </div><ErrorMessage>Example validation error with a readable recovery message.</ErrorMessage><LoadingState>Loading fixture records…</LoadingState></Panel>
                <Panel className="space-y-4"><h2 className="df-section-title">Form controls</h2>
                    <FormField label="Retained draft">{field => <Textarea {...field} rows={3} value={draft} onChange={event => setDraft(event.target.value)} />}</FormField>
                    <FormField label="Invalid field" error="Example error">{field => <Input {...field} defaultValue="Invalid value" />}</FormField>
                    <FormField label="Disabled field">{field => <Input {...field} disabled value="Unavailable" />}</FormField>
                    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" defaultChecked />Native checkbox</label>
                </Panel>
            </div>
        </main> : <AuthLayout title={view === 'Login' ? 'Welcome back' : 'Create your account'} description="Preview of the existing auth layout. No authentication is performed.">{fields}</AuthLayout>}
        <Dialog open={open} onClose={() => setOpen(false)} title="Appearance fixture dialog">
            <FormField label="Dialog draft">{field => <Textarea {...field} value={dialogDraft} onChange={event => setDialogDraft(event.target.value)} />}</FormField>
            <Button onClick={() => setOpen(false)}>Close preview</Button>
        </Dialog>
        <Toaster toastOptions={{ duration: 6000, style: { background: 'var(--df-raised)', color: 'var(--df-ink)', border: '1px solid var(--df-divider)' }, success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-success-content)' } }, error: { iconTheme: { primary: 'var(--color-error)', secondary: 'var(--color-error-content)' } } }} />
    </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><AppearanceFixture /></StrictMode>);
