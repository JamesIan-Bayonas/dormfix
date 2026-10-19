import type { HTMLAttributes, ReactNode } from 'react';

export function Panel({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={`df-panel ${className}`} />;
}
interface PageHeaderProps { title: string; description?: ReactNode; action?: ReactNode }
export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2 border-l-2 border-primary pl-4">
                <h1 tabIndex={-1} data-focus-fallback className="df-page-title">{title}</h1>
                {description && <p className="max-w-prose text-sm leading-relaxed text-muted">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </header>
    );
}

interface SectionHeaderProps {
    /** The `id` to set on the heading — used by `aria-labelledby` on the parent `<section>`. */
    id?: string;
    title: string;
    /** Optional count rendered as a pill badge after the title. */
    count?: number;
    /** Optional trailing slot (e.g. a "View all" link). */
    action?: ReactNode;
    /** Heading level rendered. Defaults to `h2`. */
    as?: 'h2' | 'h3';
}
export function SectionHeader({ id, title, count, action, as: Tag = 'h2' }: SectionHeaderProps) {
    return (
        <div className="df-section-header justify-between">
            <div className="df-section-header">
                <Tag id={id} className="df-section-title">{title}</Tag>
                {count !== undefined && (
                    <span className="df-section-count" aria-label={`${count} items`}>{count}</span>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
