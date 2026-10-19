/**
 * QuickActionsPanel — a sticky vertical strip of high-frequency CTA buttons
 * shown on the Overview page right rail.
 * Uses only df-* CSS classes; zero new styling tokens.
 */
import { Link } from 'react-router-dom';
import { UserRoundPlus, KeyRound, ReceiptText, Wrench, DoorOpen, MessageSquare } from 'lucide-react';

const ACTIONS = [
    { label: 'Review applications', icon: UserRoundPlus, to: '/tenants', description: 'Approve or decline pending applicants' },
    { label: 'Assign rooms', icon: KeyRound, to: '/tenants', description: 'Link approved tenants to a room' },
    { label: 'Check payments', icon: ReceiptText, to: '/payments', description: 'Verify or flag submitted receipts' },
    { label: 'View maintenance', icon: Wrench, to: '/maintenance', description: 'Review open maintenance requests' },
    { label: 'Manage rooms', icon: DoorOpen, to: '/rooms', description: 'Edit room details and capacity' },
    { label: 'Open messages', icon: MessageSquare, to: '/messages', description: 'Respond to tenant messages' },
] as const;

export function QuickActionsPanel() {
    return (
        <aside className="df-qa-panel" aria-label="Quick actions">
            <h2 className="px-3 pb-1 pt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
                Quick actions
            </h2>
            <nav>
                <ul className="space-y-0.5" role="list">
                    {ACTIONS.map(({ label, icon: Icon, to, description }) => (
                        <li key={label}>
                            <Link to={to} className="df-qa-btn" title={description}>
                                <span className="df-qa-icon" aria-hidden="true">
                                    <Icon size={16} />
                                </span>
                                <span className="min-w-0 truncate">{label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}
