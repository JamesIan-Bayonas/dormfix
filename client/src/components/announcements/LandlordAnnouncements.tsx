import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../UserContext';
import { useRooms } from '../../hooks/useRooms';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { announcementService, type Announcement, type AnnouncementFields } from '../../services/announcementService';
import { announcementState, localExpiry } from '../../utils/announcementPresentation';
import { AnnouncementCard, AnnouncementFeedback } from './AnnouncementList';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { PageHeader } from '../ui/Layout';
import { FormField, Input, Select, Textarea } from '../ui/FormField';
import { EmptyState, ErrorMessage } from '../ui/Feedback';
import { notify } from '../../utils/notify';

const blank: AnnouncementFields = { title: '', body: '', roomNumber: null, priority: 'standard', expiresAt: null };
export function LandlordAnnouncements() {
    const { user, logout } = useAuth();
    const resource = useAnnouncements(user);
    const rooms = useRooms(user?.id);
    const [editor, setEditor] = useState<Announcement | 'new' | null>(null);
    const [fields, setFields] = useState(blank);
    const [expiry, setExpiry] = useState('');
    const [filter, setFilter] = useState('current');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [archive, setArchive] = useState<Announcement | null>(null);
    const [notice, setNotice] = useState('');
    const [now, setNow] = useState(Date.now);
    useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
    const open = (record?: Announcement) => { setEditor(record || 'new'); setFields(record ? { title: record.title, body: record.body, roomNumber: record.roomNumber, priority: record.priority, expiresAt: record.expiresAt } : { ...blank }); setExpiry(localExpiry(record?.expiresAt || null)); setError(null); };
    async function save(status: 'draft' | 'published') {
        if (!user?.accessToken || !editor || busy) return;
        const updatingPublished = editor !== 'new' && editor.status === 'published';
        setBusy(true); setError(null); setNotice('');
        const toastId = notify.loading(status === 'published' ? updatingPublished ? 'Saving announcement…' : 'Publishing announcement…' : 'Saving draft…');
        try {
            const expiresAt = expiry ? new Date(expiry).toISOString() : null;
            if (expiresAt && Date.parse(expiresAt) <= Date.now()) throw new Error('Choose a future expiry or leave it empty.');
            const data = { ...fields, expiresAt, status };
            if (editor === 'new') await announcementService.create(user.accessToken, data);
            else await announcementService.update(user.accessToken, editor.id, editor.version, data);
            setEditor(null); setNotice(status === 'published' ? 'Announcement published for the selected audience.' : 'Draft saved. It is not visible to tenants.'); resource.retry();
            notify.success(status === 'published' ? updatingPublished ? 'Announcement updated' : 'Announcement published' : 'Draft saved', { id: toastId, description: status === 'published' ? 'Visible to the selected audience.' : 'This draft is not visible to tenants.' });
        } catch (failure) {
            const message = failure instanceof Error ? failure.message : 'Saving could not be confirmed. Refresh before trying again.';
            setError(message); notify.error('Announcement could not be saved', { id: toastId, description: message });
        }
        finally { setBusy(false); }
    }
    async function archiveNotice() {
        if (!archive || !user?.accessToken || busy) return;
        setBusy(true); setError(null); setNotice('');
        const toastId = notify.loading('Archiving announcement…');
        try {
            await announcementService.archive(user.accessToken, archive.id, archive.version); setArchive(null); setNotice('Announcement archived. Published notices remain in tenant history.'); resource.retry();
            notify.success('Announcement archived', { id: toastId, description: 'Previously published notices remain in tenant history.' });
        } catch (failure) {
            const message = failure instanceof Error ? failure.message : 'Archiving could not be confirmed.';
            setError(message); notify.error('Archiving could not be confirmed', { id: toastId, description: message });
        }
        finally { setBusy(false); }
    }
    const visible = resource.data.filter(item => filter === 'all' || (filter === 'current' ? announcementState(item, now) === 'Published' : announcementState(item, now) === filter));
    return <div className="space-y-6">
        <PageHeader title="Announcements" description="Publish dormitory updates for all tenants or a specific room." action={<Button onClick={() => open()} disabled={resource.loading || !!resource.error}><Plus size={18} aria-hidden="true" />New announcement</Button>} />
        {notice && <p role="status" className="text-sm text-success">{notice}</p>}
        {resource.loading || resource.error ? <AnnouncementFeedback resource={resource} onSignOut={logout} /> : <>
            <div className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><FormField label="Show announcements">{field => <Select {...field} value={filter} onChange={event => setFilter(event.target.value)}><option value="current">Current published notices</option><option value="Draft">Drafts</option><option value="Expired">Expired notices</option><option value="Archived">Archived notices</option><option value="all">All announcements</option></Select>}</FormField></div><Button variant="secondary" onClick={resource.retry}><RefreshCw size={18} aria-hidden="true" />Refresh</Button></div>
            {!visible.length ? <EmptyState title="No announcements in this view" description="Create a notice or select another view to find drafts and past announcements." /> : <div className="space-y-4">{visible.map(item => <AnnouncementCard key={item.id} notice={item} actions={item.status !== 'archived' ? <><Button variant="secondary" onClick={() => open(item)}>Edit {item.status === 'draft' ? 'draft' : 'announcement'}</Button><Button variant="quiet" onClick={() => { setArchive(item); setError(null); }}>Archive</Button></> : undefined} />)}</div>}
        </>}
        <Dialog open={!!editor} onClose={() => setEditor(null)} title={editor === 'new' ? 'New announcement' : 'Edit announcement'} busy={busy} wide>
            <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save('published'); }}>
                <FormField label="Title">{field => <Input {...field} data-autofocus required maxLength={160} value={fields.title} disabled={busy} onChange={event => setFields({ ...fields, title: event.target.value })} />}</FormField>
                <FormField label="Details">{field => <Textarea {...field} required maxLength={10000} rows={6} value={fields.body} disabled={busy} onChange={event => setFields({ ...fields, body: event.target.value })} />}</FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Audience" hint="Room notices are visible only to tenants currently assigned to that room.">{field => <Select {...field} value={fields.roomNumber || ''} disabled={busy || rooms.isLoading} onChange={event => setFields({ ...fields, roomNumber: event.target.value || null })}><option value="">All tenants</option>{[...new Set(rooms.rooms.map(room => room.room_number))].map(room => <option key={room} value={room}>Room {room}</option>)}{fields.roomNumber && !rooms.rooms.some(room => room.room_number === fields.roomNumber) && <option value={fields.roomNumber}>Room {fields.roomNumber} (check availability)</option>}</Select>}</FormField>
                    <FormField label="Importance">{field => <Select {...field} value={fields.priority} disabled={busy} onChange={event => setFields({ ...fields, priority: event.target.value as AnnouncementFields['priority'] })}><option value="standard">Standard</option><option value="important">Important</option></Select>}</FormField>
                </div>
                {rooms.error && <ErrorMessage>Room options could not be loaded. You can publish to all tenants or retry the room list. <Button variant="quiet" onClick={rooms.refreshRooms}>Retry rooms</Button></ErrorMessage>}
                <FormField label="Expiry" optional hint={`Uses your device timezone (${Intl.DateTimeFormat().resolvedOptions().timeZone}). Leave empty to keep the notice current until archived.`}>{field => <Input {...field} type="datetime-local" value={expiry} disabled={busy} onChange={event => setExpiry(event.target.value)} />}</FormField>
                {error && <ErrorMessage>{error} <Button variant="quiet" onClick={resource.retry}>Refresh announcements</Button><p>Your entries are retained. Close and reopen a changed notice after refreshing.</p></ErrorMessage>}
                <p className="text-sm text-muted">Publishing makes this notice visible to the selected audience. It does not send email or record that tenants have read it.</p>
                <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={() => setEditor(null)} disabled={busy}>Cancel</Button>{(editor === 'new' || editor?.status === 'draft') && <Button variant="secondary" onClick={() => void save('draft')} disabled={busy || !fields.title.trim() || !fields.body.trim()}>Save draft</Button>}<Button type="submit" loading={busy} loadingText="Saving…" disabled={!fields.title.trim() || !fields.body.trim()}>{editor !== 'new' && editor?.status === 'published' ? 'Save published changes' : 'Publish announcement'}</Button></div>
            </form>
        </Dialog>
        <Dialog open={!!archive} onClose={() => setArchive(null)} title="Archive announcement?" busy={busy}>
            <p>Remove “{archive?.title}” from current notices? Previously published notices remain in tenant history.</p>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={busy} onClick={() => setArchive(null)}>Cancel</Button><Button loading={busy} loadingText="Archiving…" onClick={() => void archiveNotice()}>Archive announcement</Button></div>
        </Dialog>
    </div>;
}
