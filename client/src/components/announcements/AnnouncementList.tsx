import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, RefreshCw } from 'lucide-react';
import type { Announcement } from '../../services/announcementService';
import type { AnnouncementResource } from '../../hooks/useAnnouncements';
import { announcementDate, announcementState, currentAnnouncements } from '../../utils/announcementPresentation';
import { Button } from '../ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';
import { PageHeader } from '../ui/Layout';
import { FormField, Select } from '../ui/FormField';

export function AnnouncementCard({ notice, actions, heading = 'h2' }: { notice: Announcement; actions?: ReactNode; heading?: 'h2' | 'h3' }) {
    const state = announcementState(notice);
    const Heading = heading;
    return <article className={`df-panel space-y-3 break-words ${notice.priority === 'important' && state === 'Published' ? 'border-warning/50 bg-warning-soft' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-3"><Heading className="min-w-0 text-lg font-semibold">{notice.title}</Heading><div className="flex flex-wrap gap-2">{notice.priority === 'important' && <StatusBadge tone="warning">Important</StatusBadge>}<StatusBadge tone={state === 'Published' ? 'info' : 'neutral'}>{state}</StatusBadge></div></div>
        <p className="text-sm text-muted">{notice.roomNumber ? `Room ${notice.roomNumber}` : 'All tenants'}{notice.publishedAt ? ` · Published ${announcementDate(notice.publishedAt)}` : ' · Not visible to tenants'}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{notice.body}</p>
        {notice.expiresAt && <p className="text-sm text-muted">{state === 'Expired' ? 'Expired' : 'Expires'} {announcementDate(notice.expiresAt)}</p>}
        {actions && <div className="flex flex-wrap gap-3 border-t border-divider pt-3">{actions}</div>}
    </article>;
}

export function AnnouncementFeedback({ resource, onSignOut }: { resource: AnnouncementResource; onSignOut: () => void }) {
    if (resource.loading) return <LoadingState>Loading announcements…</LoadingState>;
    if (resource.error) return <ErrorState title={resource.needsSignIn ? 'Sign-in required for announcements' : 'Announcements unavailable'} description={resource.error} action={resource.needsSignIn ? <Button variant="secondary" onClick={onSignOut}>Sign out to sign in again</Button> : <Button variant="secondary" onClick={resource.retry}>Retry announcements</Button>} />;
    return null;
}

export function TenantAnnouncements({ resource, onSignOut, preview = false }: { resource: AnnouncementResource; onSignOut: () => void; preview?: boolean }) {
    const [filter, setFilter] = useState('current');
    const [now, setNow] = useState(Date.now);
    useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
    const current = currentAnnouncements(resource.data, now);
    const notices = preview ? current.slice(0, 3) : filter === 'current' ? current : resource.data;
    return <section className="space-y-4" aria-label="Dorm announcements">
        {preview ? <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="df-section-title flex items-center gap-2"><Megaphone size={20} aria-hidden="true" />Dorm announcements</h2><Link to="/announcements" className="df-button df-button--quiet">View all announcements</Link></div> : <><Link to="/" className="df-button df-button--quiet">Back to home</Link><PageHeader title="Dorm announcements" description="Updates for your dormitory and room. Expired and archived notices remain in history." action={<Button variant="secondary" onClick={resource.retry}><RefreshCw size={18} aria-hidden="true" />Refresh</Button>} /></>}
        {resource.loading || resource.error ? <AnnouncementFeedback resource={resource} onSignOut={onSignOut} /> : <>
            {!preview && resource.data.length > 0 && <FormField label="Show announcements">{field => <Select {...field} value={filter} onChange={event => setFilter(event.target.value)}><option value="current">Current announcements</option><option value="history">All announcements and history</option></Select>}</FormField>}
            {!notices.length ? <EmptyState title={preview || filter === 'current' ? 'No current announcements' : 'No announcements yet'} description="Notices from your landlord will appear here when published for your dormitory or room." /> : <div className="space-y-4">{notices.map(notice => <AnnouncementCard key={notice.id} notice={notice} heading={preview ? 'h3' : 'h2'} />)}</div>}
        </>}
    </section>;
}
