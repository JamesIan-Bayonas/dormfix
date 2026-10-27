import type { ReactNode } from 'react';
import { MessageSquare, ArrowUpLeft } from 'lucide-react';

export function ContactAvatar({ name }: { name: string }) {
    const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'T';
    return <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-primary">{initials}</span>;
}

export function MessagesLayout({ contacts, selected, children }: { contacts: ReactNode; selected: boolean; children?: ReactNode }) {
    return <div className="grid min-w-0 overflow-hidden rounded-2xl border border-divider bg-surface lg:min-h-[42rem] lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className={`${selected ? 'hidden lg:block' : ''} min-w-0 lg:border-r lg:border-divider`}>{contacts}</div>
        {selected ? children : <section aria-label="Conversation preview" className="hidden min-w-0 flex-col items-center justify-center gap-5 bg-canvas p-8 text-center lg:flex">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl border border-divider bg-surface text-primary"><MessageSquare size={34} strokeWidth={1.5} aria-hidden="true" /></span>
            <div className="max-w-sm space-y-3"><h2 className="df-section-title">Your tenant conversations</h2><p className="text-sm leading-relaxed text-muted">Keep room questions, payment follow-ups, and everyday dorm updates in one conversation with each tenant.</p></div>
            <p className="inline-flex items-center gap-2 rounded-full border border-divider bg-surface px-4 py-2 text-sm text-muted"><ArrowUpLeft size={17} aria-hidden="true" />Choose a tenant to get started</p>
        </section>}
    </div>;
}
